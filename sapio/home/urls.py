from django.urls import path
from . import views

urlpatterns = [
    path('home/', views.home_view, name='home'),

    path('recruitment/', views.recruitment_view, name='recruitment'),
    path('chat/', views.chat_view, name='chat'),
    path('friend/', views.friend_view, name='friend'),

    path('get_group_chat_recruitments/', views.get_group_chat_recruitments, name='get_group_chat_recruitments'),
    path('get_individual_chat_recruitments/', views.get_individual_chat_recruitments, name='get_individual_chat_recruitments'),
    path('get_group_chat_rooms/', views.get_group_chat_rooms, name='get_group_chat_rooms'),
    path('get_individual_chat_rooms/', views.get_individual_chat_rooms, name='get_individual_chat_rooms'),
    path('get_friends/', views.get_friends, name='get_friends'),
    path('get_friend_requests/', views.get_friend_requests, name='get_friend_requests'),

    path('make_recruitment/', views.recruitment_creation_view, name='make_recruitment'),
    path('delete_recruitment/<str:room_type>/<str:id>', views.delete_recruitment, name='delete_recruitment'),

    path('recruitment_detail/<str:type>/<str:id>', views.recruitment_detail_view, name='recruitment_detail'),
    path('room_detail/<str:id>', views.room_detail_view, name='room_detail'),
    
    path('', views.index_view, name='index'),
    # path('prefectures/', views.create_prefectures),
    # path('test/', views.test),
]