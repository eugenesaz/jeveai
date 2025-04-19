
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Define translations directly
const resources = {
  en: {
    translation: {
      "app": {
        "name": "Paradise Knowledge Hub",
        "tagline": "Share your expertise with the world"
      },
      "navigation": {
        "home": "Home",
        "login": "Login",
        "signup": "Sign Up",
        "logout": "Logout",
        "dashboard": "Dashboard",
        "projects": "Projects",
        "createProject": "Create Project",
        "profile": "Profile",
        "language": "Language",
        "cancel": "Cancel"
      },
      "auth": {
        "email": "Email",
        "password": "Password",
        "confirmPassword": "Confirm Password",
        "forgotPassword": "Forgot Password?",
        "noAccount": "Don't have an account?",
        "hasAccount": "Already have an account?",
        "signupNow": "Sign up now",
        "loginNow": "Login now",
        "googleLogin": "Continue with Google",
        "or": "or"
      },
      "influencer": {
        "benefits": {
          "title": "Scale Your Influence",
          "subtitle": "Share your knowledge and expertise with a global audience",
          "virtualAssistant": "Create a virtual assistant based on your knowledge",
          "scaleYourBusiness": "Scale your business with modern AI technologies",
          "access247": "Give your customers access to virtual You 24/7",
          "hyperPersonalized": "Give your customers hyper-personalized experience"
        },
        "dashboard": {
          "title": "Dashboard",
          "projects": "Projects",
          "courses": "Courses",
          "customers": "Customers",
          "createProject": "Create New Project",
          "createCourse": "Create New Course"
        },
        "project": {
          "title": "Projects",
          "createNew": "Create New Project",
          "name": "Project Name",
          "status": "Project Status",
          "urlName": "URL Name",
          "colorScheme": "Color Scheme",
          "landingImage": "Landing Image",
          "active": "Active",
          "inactive": "Not Active",
          "save": "Save Project",
          "shareUrl": "Share URL",
          "copyUrl": "Copy URL",
          "blue": "Blue",
          "red": "Red",
          "orange": "Orange",
          "green": "Green",
          "urlCopied": "URL copied to clipboard!"
        },
        "course": {
          "title": "Courses",
          "createNew": "Create New Course",
          "name": "Course Name",
          "description": "Course Description",
          "status": "Status",
          "type": "Course Type",
          "price": "Price (USD)",
          "duration": "Duration (Days)",
          "recurring": "Recurring Payment",
          "details": "Course Details",
          "telegramBot": "Telegram Chatbot Name",
          "active": "Active",
          "inactive": "Not Active",
          "save": "Save Course",
          "types": {
            "diet": "Diet",
            "mentalHealth": "Mental Health",
            "sport": "Sport",
            "business": "Business",
            "education": "Education",
            "other": "Other"
          },
          "oneTime": "One-time",
          "yes": "Yes",
          "no": "No"
        }
      },
      "no": {
        "courses": "No courses yet",
        "project": "No Project"
      },
      "view": "View",
      "edit": "Edit",
      "loading": "Loading courses...",
      "customer": {
        "courses": {
          "title": "Courses",
          "active": "Active Courses",
          "available": "Available Courses",
          "enroll": "Enroll",
          "view": "View",
          "courseInfo": "Course Information",
          "duration": "Duration",
          "price": "Price",
          "type": "Type",
          "recurring": "Recurring",
          "oneTime": "One-time payment",
          "purchase": "Purchase",
          "cancel": "Cancel",
          "days": "days"
        },
        "social": {
          "title": "Connect Social Media",
          "description": "Please provide at least one social media account:",
          "telegram": "Telegram (@username)",
          "instagram": "Instagram (username)",
          "tiktok": "TikTok (username)",
          "save": "Save and Continue"
        }
      },
      "admin": {
        "title": "Administration",
        "influencers": "Influencers",
        "projects": "Projects",
        "keys": {
          "stripe": "Stripe Secret Key",
          "gemini": "Gemini API Key",
          "save": "Save Keys"
        }
      },
      "errors": {
        "required": "This field is required",
        "invalidEmail": "Please enter a valid email",
        "passwordLength": "Password must be at least 8 characters",
        "passwordMatch": "Passwords do not match",
        "uniqueUrlName": "This URL name is already taken",
        "uniqueCourseName": "This course name is already taken",
        "uniqueBotName": "This bot name is already taken",
        "minPrice": "Price must be greater than 0",
        "socialRequired": "At least one social media account is required",
        "botNameInvalid": "Bot name can only contain letters, numbers, and underscores"
      },
      "success": {
        "projectCreated": "Project created successfully!",
        "projectUpdated": "Project updated successfully!",
        "courseCreated": "Course created successfully!",
        "courseUpdated": "Course updated successfully!",
        "enrolled": "Successfully enrolled in course!",
        "socialSaved": "Social media accounts saved successfully!"
      },
      "edit": {
        "course": {
          "title": "Edit Course",
          "save": "Save Changes",
          "cancel": "Cancel",
          "success": "Course updated successfully!",
          "error": "Failed to update course"
        }
      },
      "cancel": "Cancel"
    }
  },
  ru: {
    translation: {
      "app": {
        "name": "Paradise Knowledge Hub",
        "tagline": "Поделитесь знаниями со всем миром"
      },
      "navigation": {
        "home": "Главная",
        "login": "Вход",
        "signup": "Регистрация",
        "logout": "Выход",
        "dashboard": "Панель управления",
        "projects": "Проекты",
        "createProject": "Создать проект",
        "profile": "Профиль",
        "language": "Язык",
        "cancel": "Отмена"
      },
      "auth": {
        "email": "Эл. почта",
        "password": "Пароль",
        "confirmPassword": "Подтвердите пароль",
        "forgotPassword": "Забыли пароль?",
        "noAccount": "Нет аккаунта?",
        "hasAccount": "Уже есть аккаунт?",
        "signupNow": "Зарегистрироваться",
        "loginNow": "Войти",
        "googleLogin": "Продолжить с Google",
        "or": "или"
      },
      "influencer": {
        "benefits": {
          "title": "Масштабируйте свое влияние",
          "subtitle": "Поделитесь своими знаниями и опытом с мировой аудиторией",
          "virtualAssistant": "Создайте виртуального помощника на основе своих знаний",
          "scaleYourBusiness": "Масштабируйте свой бизнес с современными AI технологиями",
          "access247": "Предоставьте клиентам доступ к виртуальному Вам 24/7",
          "hyperPersonalized": "Дайте клиентам гипер-персонализированный опыт"
        },
        "dashboard": {
          "title": "Панель управления",
          "projects": "Проекты",
          "courses": "Курсы",
          "customers": "Клиенты",
          "createProject": "Создать новый проект",
          "createCourse": "Создать новый курс"
        },
        "project": {
          "title": "Проекты",
          "createNew": "Создать новый проект",
          "name": "Название проекта",
          "status": "Статус проекта",
          "urlName": "URL-имя",
          "colorScheme": "Цветовая схема",
          "landingImage": "Изображение лендинга",
          "active": "Активен",
          "inactive": "Не активен",
          "save": "Сохранить проект",
          "shareUrl": "Поделиться URL",
          "copyUrl": "Копировать URL",
          "blue": "Синий",
          "red": "Красный",
          "orange": "Оранжевый",
          "green": "Зеленый",
          "urlCopied": "URL скопирован в буфер обмена!"
        },
        "course": {
          "title": "Курсы",
          "createNew": "Создать новый курс",
          "name": "Название курса",
          "description": "Описание курса",
          "status": "Статус",
          "type": "Тип курса",
          "price": "Цена (USD)",
          "duration": "Длительность (дней)",
          "recurring": "Повторяющийся платеж",
          "details": "Подробности курса",
          "telegramBot": "Имя Telegram бота",
          "active": "Активен",
          "inactive": "Не активен",
          "save": "Сохранить курс",
          "types": {
            "diet": "Диета",
            "mentalHealth": "Психическое здоровье",
            "sport": "Спорт",
            "business": "Бизнес",
            "education": "Образование",
            "other": "Другое"
          },
          "oneTime": "Разовый платеж",
          "yes": "Да",
          "no": "Нет"
        }
      },
      "no": {
        "courses": "Пока нет курсов",
        "project": "Нет проекта"
      },
      "view": "Просмотр",
      "edit": "Редактировать",
      "loading": "Загрузка курсов...",
      "customer": {
        "courses": {
          "title": "Курсы",
          "active": "Активные курсы",
          "available": "Доступные курсы",
          "enroll": "Записаться",
          "view": "Просмотр",
          "courseInfo": "Информация о курсе",
          "duration": "Продолжительность",
          "price": "Цена",
          "type": "Тип",
          "recurring": "Повторяющийся",
          "oneTime": "Разовый платеж",
          "purchase": "Купить",
          "cancel": "Отмена",
          "days": "дней"
        },
        "social": {
          "title": "Подключить социальные сети",
          "description": "Укажите хотя бы один аккаунт в социальных сетях:",
          "telegram": "Telegram (@username)",
          "instagram": "Instagram (username)",
          "tiktok": "TikTok (username)",
          "save": "Сохранить и продолжить"
        }
      },
      "admin": {
        "title": "Администрирование",
        "influencers": "Инфлюэнсеры",
        "projects": "Проекты",
        "keys": {
          "stripe": "Ключ Stripe",
          "gemini": "Ключ API Gemini",
          "save": "Сохранить ключи"
        }
      },
      "errors": {
        "required": "Это поле обязательно",
        "invalidEmail": "Введите корректный email",
        "passwordLength": "Пароль должен содержать не менее 8 символов",
        "passwordMatch": "Пароли не совпадают",
        "uniqueUrlName": "Это URL-имя уже занято",
        "uniqueCourseName": "Это название курса уже занято",
        "uniqueBotName": "Это имя бота уже занято",
        "minPrice": "Цена должна быть больше 0",
        "socialRequired": "Требуется указать хотя бы один аккаунт в социальных сетях",
        "botNameInvalid": "Имя бота может содержать только буквы, цифры и знаки подчеркивания"
      },
      "success": {
        "projectCreated": "Проект успешно создан!",
        "projectUpdated": "Проект успешно обновлен!",
        "courseCreated": "Курс успешно создан!",
        "courseUpdated": "Курс успешно обновлен!",
        "enrolled": "Вы успешно записались на курс!",
        "socialSaved": "Аккаунты социальных сетей успешно сохранены!"
      },
      "edit": {
        "course": {
          "title": "Редактировать курс",
          "save": "Сохранить изменения",
          "cancel": "Отмена",
          "success": "Курс успешно обновлен!",
          "error": "Не удалось обновить курс"
        }
      },
      "cancel": "Отмена"
    }
  }
};

i18n
  .use(LanguageDetector) 
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru'],
    detection: {
      order: ['localStorage', 'navigator'], // Changed order to prioritize localStorage
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
