from django.http import  JsonResponse

from base.views import chekctoken

WHITE_URLS = ( '/apis/login/')


class RequestMideleware(object):
    def process_request(self, request):
        if request.path_info in WHITE_URLS:
            return
        try:
            ret = chekctoken(request)
            if not ret:
                response =JsonResponse({'result': 'Unauthorized'})
                response.status_code = 401
                return response
        except:
            return
