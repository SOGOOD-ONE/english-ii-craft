from django.urls import path
from exam.views import ExamYearsView, ExamContentView, AITranslateView

app_name = 'exam'

urlpatterns = [
    path('years', ExamYearsView.as_view(), name='years-list'),
    path('content/<str:module>/<int:year>', ExamContentView.as_view(), name='content-year'),
    path('translate', AITranslateView.as_view(), name='ai-translate'),
]
