import xml.etree.cElementTree as ET
test_data = {
    'bridge': {
        'ip': '1.1.1.1',
        'mask': '255.255.255.255',
        'dns': [
            '22.22.22',
            '3.3.3.3'
        ]
    },
    'bridge2': {
        'ip': '2.2.2.2',
        'mask': '255.255.255.255',
        'dns': [
            '3.3.3.3',
            '4.4.4.4'
        ]
    }
}

count = 0


def parse_json(data):
    global count
    if isinstance(data, dict):
        for key, value in data.items():
            print key
            parse_json(value)
    elif isinstance(data, list):
        for ls in data:
            parse_json(ls)
    elif isinstance(data, str):
        print data
    print count
    count += 1

def parse_json_ele(data):
    elem = None
    if isinstance(data, dict):
        for key, value in data.items():
            elem = ET.Element('key')
            parse_json(value)
    elif isinstance(data, list):
        for ls in data:
            parse_json(ls)
    elif isinstance(data, str):
        print data

parse_json(test_data)
