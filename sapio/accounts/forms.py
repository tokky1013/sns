from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model

User = get_user_model()

class  ValidationForm0(UserCreationForm):
    class Meta:
        model = User
        fields = (
            'email',
        )

class  ValidationForm1(UserCreationForm):
    class Meta:
        model = User
        fields = ()

class  ValidationForm2(UserCreationForm):
    class Meta:
        model = User
        fields = (
            'username',
        )

class  CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = (
            'email',
            'username',
            'area_of_residence', 
            'date_of_birth', 
            'gender', 
            'self_introduction',
        )