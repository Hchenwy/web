import os
import version.ekko as e
from base.settings import BASE_DIR

local = os.path.join(BASE_DIR, 'version', 'local_ammunition')
des = os.path.join(BASE_DIR, 'version', 'test_dir')

# 1.x merge 5.x
e.update_configure(local, des)

# e.upgrade_configure(1, 5, des)
