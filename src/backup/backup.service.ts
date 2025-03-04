import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as schedule from 'node-schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupPath: string;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.backupPath = path.join(process.cwd(), 'backups');
    this.initializeBackups();
  }

  private initializeBackups() {
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }

    // Schedule daily backups at 2 AM
    schedule.scheduleJob('0 2 * * *', () => {
      this.createBackup();
    });
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(this.backupPath, filename);

    try {
      const { host, port, username, password, database } = this.dataSource.options as any;

      await execAsync(
        `PGPASSWORD=${password} pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F c -f ${filepath}`,
      );

      this.logger.log(`Backup created successfully: ${filename}`);
      return filepath;
    } catch (error) {
      this.logger.error(`Backup failed: ${error.message}`);
      throw error;
    }
  }

  async restore(filepath: string): Promise<void> {
    try {
      const { host, port, username, password, database } = this.dataSource.options as any;

      await execAsync(
        `PGPASSWORD=${password} pg_restore -h ${host} -p ${port} -U ${username} -d ${database} -c ${filepath}`,
      );

      this.logger.log(`Restore completed successfully from: ${filepath}`);
    } catch (error) {
      this.logger.error(`Restore failed: ${error.message}`);
      throw error;
    }
  }

  async listBackups(): Promise<string[]> {
    return fs.promises.readdir(this.backupPath);
  }

  async cleanOldBackups(daysToKeep: number = 30): Promise<void> {
    const files = await this.listBackups();
    const now = new Date().getTime();

    for (const file of files) {
      const filepath = path.join(this.backupPath, file);
      const stats = await fs.promises.stat(filepath);
      const daysOld = (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

      if (daysOld > daysToKeep) {
        await fs.promises.unlink(filepath);
        this.logger.log(`Deleted old backup: ${file}`);
      }
    }
  }
}