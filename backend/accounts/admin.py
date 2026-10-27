from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('ZeroRisk', {'fields': ('display_name',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'display_name', 'usable_password', 'password1', 'password2'),
        }),
    )
    list_display = ('username', 'display_name', 'email', 'is_staff', 'date_joined')
    search_fields = ('username', 'display_name', 'email')