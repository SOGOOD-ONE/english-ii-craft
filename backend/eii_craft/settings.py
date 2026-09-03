"""
Django settings for English-II-Craft backend project.

Production 部署时请通过环境变量(或 .env 文件由 python-decouple/django-environ 读取)
覆盖 SECRET_KEY / DEBUG / ALLOWED_HOSTS / DATABASE_URL / GLOBAL_AI_API_KEY / CORS_ALLOWED_ORIGINS
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent  # 仓库根,指向 content/ 真题目录

# ------- 可选 .env 加载 -------
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv(BASE_DIR / '.env')
except Exception:
    # python-dotenv 没装也没事,直接读进程 env
    pass


def _env_bool(name: str, default: bool) -> bool:
    v = os.environ.get(name)
    if v is None:
        return default
    return str(v).lower() in ('1', 'true', 'yes', 'y', 'on')


def _env_list(name: str, default: list[str]) -> list[str]:
    v = os.environ.get(name)
    if not v:
        return default
    return [x.strip() for x in v.split(',') if x.strip()]


SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-LOCAL_DEV_ONLY_change-me-please')
DEBUG = _env_bool('DEBUG', True)
ALLOWED_HOSTS = _env_list('ALLOWED_HOSTS', ['*'] if DEBUG else [])

# ------- 应用 -------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # 第三方
    'rest_framework',
    'drf_spectacular',
    'corsheaders',
    # 业务
    'accounts',
    'vocab',
    'writing',
    'translation',
    'exam',
    # ai_provider 不暴露路由,只提供 SDK 服务,放在 INSTALLED_APPS 中便于管理命令
    'ai_provider',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',    # 必须放在 CommonMiddleware 之前
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'accounts.middleware.DeviceAuthMiddleware',       # 匿名设备认证 取代 JWT/用户
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'eii_craft.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'eii_craft.wsgi.application'

# ------- 数据库: 开发 SQLite / 生产 DATABASE_URL --------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / os.environ.get('DATABASE_NAME', 'db.sqlite3'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ------- DRF (无 JWT, 用 DeviceAuthMiddleware 处理 X-Device-Id) -------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': 'vocab.pagination.FlexiblePageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# ------- CORS / CSRF --------
CORS_ALLOWED_ORIGINS = _env_list(
    'CORS_ALLOWED_ORIGINS',
    ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3001', 'http://127.0.0.1:3001',
     'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177',
     'http://localhost:5178', 'http://localhost:5179', 'http://localhost:5180'],
)
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = _env_list(
    'CSRF_TRUSTED_ORIGINS',
    ['http://localhost:5173', 'http://127.0.0.1:5173'],
)

# ------- 真题 JSON 共享目录根路径: backend/../content/ -------
EXAM_CONTENT_ROOT = PROJECT_ROOT / 'content'

# ------- 全局 AI Provider 配置(用户未设置时的兜底) -------
# 从 .env 读取, 如果 .env 里没配, 就从环境变量取, 再没有就用下方默认值
GLOBAL_AI_BASE_URL = os.environ.get('GLOBAL_AI_BASE_URL', 'https://open.bigmodel.cn/api/paas/v4').rstrip('/')
GLOBAL_AI_API_KEY = os.environ.get('GLOBAL_AI_API_KEY', '')
GLOBAL_AI_MODEL = os.environ.get('GLOBAL_AI_MODEL', 'glm-4-flash')

# ------- drf-spectacular API 文档 -------
SPECTACULAR_SETTINGS = {
    'TITLE': 'English-II-Craft API',
    'DESCRIPTION': '考研英语二攻坚工坊 · 严格分离前后端 Django REST Framework 接口。'
                   'Swagger UI: /api/schema/docs · ReDoc: /api/schema/redoc',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': r'/api/v[0-9]+/',
    'COMPONENT_SPLIT_REQUEST': True,
}
