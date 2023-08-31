from django.db import models
from django.utils import timezone
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin, UserManager
from django.contrib.auth.validators import UnicodeUsernameValidator
import uuid as uuid_lib
from django.core.mail import send_mail
from django.utils.translation import gettext_lazy as _

# Create your models here.
class Area(models.Model):
    area_name = models.CharField(max_length=5)

    class Meta:
        verbose_name_plural = '地方'

    def __str__(self):
        return self.area_name

class Prefecture(models.Model):
    prefecture_name = models.CharField(max_length=5)
    area = models.ForeignKey(Area, on_delete=models.CASCADE)

    class Meta:
        verbose_name_plural = '都道府県'

    def __str__(self):
        return self.prefecture_name

class User(AbstractBaseUser, PermissionsMixin):
    username_validator = UnicodeUsernameValidator()

    uuid = models.UUIDField(
        default=uuid_lib.uuid4,
        primary_key=True,
        editable=False
    )
    username = models.CharField(
        _('username'),
        max_length=20,
        validators=[username_validator],
        error_messages={
            'max_length': 'ユーザー名は20文字以内で設定してください。',
        },
    )
    email = models.EmailField(_('email address'), unique=True)

    profile_icon = models.ImageField(_('profile icon'), upload_to='profile_icons', default='default.PNG')
    self_introduction = models.TextField(_('self introduction'), max_length=512, default='', blank=True)
    gender = models.CharField(
        max_length=30,
        choices=[('male', '男性'), ('female', '女性')],
        null=True, 
        blank=True,
    )
    area_of_residence = models.ForeignKey(Prefecture, on_delete=models.SET_NULL, related_name='user_lives_in', null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)

    is_admin = models.BooleanField(default=True)
    is_staff = models.BooleanField(_('staff status'), default=False)
    is_active = models.BooleanField(_('active'), default=True)
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)

    friends = models.ManyToManyField("self", blank=True)
    friend_requests = models.ManyToManyField("self", related_name="requested_by", symmetrical=False, blank=True)
    blocked = models.ManyToManyField("self", blank=True)

    objects = UserManager()
    EMAIL_FIELD = 'email'
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = _('ユーザー')
        verbose_name_plural = _('ユーザー')
        db_table = 'users'
        swappable = 'AUTH_USER_MODEL'
    
    def __str__(self):
        return self.username
    
    def clean(self):
        super().clean()
        self.email = self.__class__.objects.normalize_email(self.email)
    
    def email_user(self, subject, message, from_email=None, **kwargs):
        send_mail(subject, message, from_email, self.email, **kwargs)
