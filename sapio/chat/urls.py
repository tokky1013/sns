from django.urls import path
from . import views

urlpatterns = [
    path('room/<str:type>/<str:room_id>/', views.room_view, name='room'),
    path('get_messages/<str:type>/<str:room_id>/', views.get_messages, name='get_messages'),
    path('create_individual_room/<str:uuid>/', views.create_individual_room, name='create_individual_room'),
    path('join_group/<str:group_id>/', views.join_group, name='join_group'),
    path('leave_group/<str:group_id>/', views.leave_group, name='leave_group'),
]