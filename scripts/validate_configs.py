import sys
sys.path.insert(0, '.')
from src.config.config_loader import load_config, get_dataset_path, get_checkpoint_path
from pathlib import Path

ROOT = Path('.')

for cfg_file in ['configs/baseline.yaml', 'configs/classical_augmentation.yaml', 'configs/generated_data.yaml']:
    cfg = load_config(cfg_file)
    exp_name = cfg['experiment_name']
    print(f'Config loaded: {cfg_file}')
    print(f'  experiment_name : {exp_name}')
    dataset_path_rel = cfg.get('dataset', {}).get('path')
    if dataset_path_rel:
        dp = get_dataset_path(cfg, ROOT)
        print(f'  dataset.path    : {dp} (exists={dp.exists()})')
    checkpoint_rel = cfg.get('output', {}).get('checkpoint')
    if checkpoint_rel:
        cp = get_checkpoint_path(cfg, ROOT)
        print(f'  checkpoint      : {cp} (exists={cp.exists()})')
    print()

print('All configs OK')
