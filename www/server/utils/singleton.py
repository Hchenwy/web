def singleton(cls, *args, **kw):
    instances = {}

    def _singleton():
        if cls not in instances:
            instances[cls] = cls(*args, **kw)
        return instances[cls]

    return _singleton


class Singleton(type):
    def __init__(cls, name, bases, attrs):
        super(Singleton, cls).__init__(name, bases, attrs)
        cls._instance = None

    def __call__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(Singleton, cls).__call__(*args)
        return cls._instance


class Foo(object):
    __metaclass__ = Singleton


if __name__ == '__main__':
    a= Foo()
    b = Foo()
    print a is b
    a.x = 1
    print b.x
