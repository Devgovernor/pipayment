from setuptools import setup, find_packages

setup(
    name="pi-payment-gateway",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "requests>=2.31.0",
        "cryptography>=41.0.0",
    ],
    author="Pi Payment Gateway",
    author_email="support@pipaymentgateway.com",
    description="Python SDK for Pi Payment Gateway",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    url="https://github.com/pi-payment-gateway/python-sdk",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.7",
)