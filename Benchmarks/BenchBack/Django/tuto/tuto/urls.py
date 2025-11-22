from django.urls import include, path
from rest_framework import routers

from tuto.quickstart import views

router = routers.DefaultRouter()
router.register(r"users", views.UserViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("auth/register", views.register, name="register"),
    path("auth/login", views.login, name="login"),
    path("auth/profile", views.profile, name="profile"),
]
