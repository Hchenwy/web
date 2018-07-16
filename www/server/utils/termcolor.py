class Ansicolor:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'

    def disable(self):
        self.HEADER = ''
        self.OKBLUE = ''
        self.OKGREEN = ''
        self.WARNING = ''
        self.FAIL = ''
        self.ENDC = ''


def color_print(before, word, state):
    if not (0 <= state < 5):
        return
    linemax = 128
    line = before + (linemax - len(before) - len(word)) * ' '
    if state == 0:
        print line + Ansicolor.OKGREEN + word + Ansicolor.ENDC
    elif state == 1:
        print line + Ansicolor.OKBLUE + word + Ansicolor.ENDC
    elif state == 2:
        print line + Ansicolor.HEADER + word + Ansicolor.ENDC
    elif state == 3:
        print line + Ansicolor.WARNING + word + Ansicolor.ENDC
    elif state == 4:
        print line + Ansicolor.FAIL + word + Ansicolor.ENDC
