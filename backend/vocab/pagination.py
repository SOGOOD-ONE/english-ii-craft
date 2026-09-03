from rest_framework.pagination import PageNumberPagination


class FlexiblePageNumberPagination(PageNumberPagination):
    """支持 ?page_size= 自定义每页大小的分页类"""
    page_size_query_param = 'page_size'
    max_page_size = 9999