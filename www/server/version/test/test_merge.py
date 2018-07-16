import jsonmerge
import collections
from pprint import pprint

local = {
    "br": [
        {
            "aaa": "bbbxxxxxxxxxxxxxx",
            "ccc": "ddd",
            "ccc2222": "ddd"
        },
        {
            "eee": "fff",
            "ggg": "hhh"
        },
        {
            "aaa": "bbb",
            "ccc": "ddd",
            "ccc2222": "ddd"
        },

    ]
}
dest = {
    "br": [
        {"eee": "fffxxxxxxxxxxxxx",
         "ggg": "hhh"
         },
        {
            "aaa": "bbb22222222222222222",
            "ccc": "ddd"
        }
    ]
}


# pprint(jsonmerge.merge(local, destination))


def update(d, u):
    for k, v in u.iteritems():
        if isinstance(v, collections.Mapping):
            r = update(d.get(k, {}), v)
            d[k] = r
        else:
            d[k] = u[k]
    return d


def merge_dicts(original, addition):
    for key, value in addition.iteritems():
        if key in original:
            original_value = original[key]
            if isinstance(value, collections.Mapping) and isinstance(original_value, collections.Mapping):
                merge_dicts(original_value, value)
            elif not (isinstance(value, collections.Mapping) or isinstance(original_value, collections.Mapping)):
                original[key] = value
            else:
                raise ValueError('Attempting to merge {} with value {}'.format(
                    key, original_value))
        else:
            original[key] = value
    return original


import json

print '11111111111111', json.dumps(
    update(json.loads(json.dumps(local, sort_keys=True)), json.loads(json.dumps(dest, sort_keys=True))),
    indent=4)
print '22222222222222', json.dumps(jsonmerge.merge(local, dest), indent=4)
print '33333333333333', json.dumps(merge_dicts(local, dest), indent=4)
