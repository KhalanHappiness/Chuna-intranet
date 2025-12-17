#!/usr/bin/env bash
set -e

echo "Installing dependencies..."
python -m pip install -r requirements.txt

echo "Running database migrations..."
python -m flask db upgrade

echo "Build complete!"
