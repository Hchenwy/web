from json2xml.json2xml import Json2xml
data = Json2xml.fromjsonfile('../config/example.json').data
data_object = Json2xml(data)
print data_object.json2xml()