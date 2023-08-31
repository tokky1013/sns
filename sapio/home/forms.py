from dataclasses import field
from django import forms
from .models import GroupChatRoom, GroupChatRecruitment, IndividualChatRecruitment

class GroupForm(forms.ModelForm):
    class Meta:
        model = GroupChatRoom
        fields = ('group_name')

class GroupRecruitmentForm(forms.ModelForm):
    class Meta:
        model = GroupChatRecruitment
        fields = ('explanation')

class IndividualRecruitmentForm(forms.ModelForm):
    class Meta:
        model = IndividualChatRecruitment
        fields = ('explanation')