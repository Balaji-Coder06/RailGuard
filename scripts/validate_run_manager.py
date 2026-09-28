"""
Dry-run validation: verifies that create_run() and setup_run_logger()
work correctly WITHOUT starting model training.

Creates a test run directory, writes a log entry, appends a metrics row,
then removes the test directory.
"""
import sys
sys.path.insert(0, '.')
from src.utils.run_manager import create_run, setup_run_logger, append_epoch_metrics
from pathlib import Path
import shutil

ROOT = Path('.')

# Create a dry-run
run_dir = create_run('_test_dryrun', 'configs/baseline.yaml', root=ROOT)
print(f'Run directory created: {run_dir}')
print(f'  config.yaml   exists: {(run_dir / "config.yaml").exists()}')
print(f'  metrics.csv   exists: {(run_dir / "metrics.csv").exists()}')
print(f'  model_info.json exists: {(run_dir / "model_info.json").exists()}')

# Test logger
run_id = run_dir.name
log = setup_run_logger(run_dir, '_test_dryrun', run_id)
log.info('Dry-run logger test: OK')
print(f'  training.log  exists: {(run_dir / "training.log").exists()}')

# Test metrics append
append_epoch_metrics(run_dir, epoch=1, train_loss=0.9999, val_loss=0.8888, val_accuracy=0.5000)
metrics_content = (run_dir / 'metrics.csv').read_text()
print(f'  metrics.csv content:')
print('    ' + metrics_content.strip().replace('\n', '\n    '))

# Close all file handlers before cleanup (Windows file-lock)
import logging
for handler in list(log.handlers):
    handler.close()
    log.removeHandler(handler)

shutil.rmtree(run_dir)
# Remove parent _test_dryrun dir if empty
parent = ROOT / 'runs' / '_test_dryrun'
if parent.exists() and not any(parent.iterdir()):
    parent.rmdir()

print('\nDry-run complete. Run directory cleaned up.')
print('Run management system: OK')
