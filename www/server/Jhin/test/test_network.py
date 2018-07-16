from Jhin.jhin import Jhin

jhin = Jhin()

jhin.load_whisper('network')

print 'mode is', jhin.get('mode')
print 'external list', jhin.get('external')
print 'bridge0 json', jhin.get('bridge0')
print 'bridge0 name', jhin.get('bridge0', 'name')
print 'bridge0 interface', jhin.get('bridge0', 'interface')

ls = []
if not ls:
    print 'true'
print type(ls).__name__