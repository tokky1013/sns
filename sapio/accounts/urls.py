from django.urls import path
from django.contrib.auth.views import LoginView, LogoutView
from . import views

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('signup/', views.signup_view, name='signup'),
    path('create_account/', views.create_account, name='create_account'),
    path('profile/<str:uuid>/', views.profile_view, name='profile'),
    path('setting/', views.setting_view, name='setting'),
    path('validate/<int:page_num>', views.validate, name='validate'),

    path('send_friend_request/<str:uuid>/', views.send_friend_request, name='send_friend_request'),
    path('reject_friend_request/<str:uuid>/', views.reject_friend_request, name='reject_friend_request'),
]