import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "app": {
        "name": "Jeve",
        "tagline": "Share your expertise with the world"
      },
      "navigation": {
        "home": "Home",
        "login": "Login",
        "signup": "Sign Up",
        "logout": "Logout",
        "dashboard": "Dashboard",
        "projects": "Projects",
        "courses": "Manage Courses",
        "createProject": "Create Project",
        "profile": "Profile",
        "language": "Language",
        "cancel": "Cancel",
        "logout_success": "Successfully logged out",
        "logout_error": "Failed to log out. Please try again."
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
        },
        "projects": {
          "title": "Influencer Projects"
        }
      },
      "project": {
        "manageKnowledge": "Manage Knowledge",
        "knowledge": "Project Knowledge",
        "addKnowledge": "Add Knowledge",
        "orUploadDocuments": "Or Upload Documents",
        "noKnowledge": "No knowledge added to this project yet"
      },
      "profile": {
        "title": "User Profile",
        "email": "Email",
        "telegram": "Telegram",
        "save": "Save Profile",
        "updateSuccess": "Profile updated successfully",
        "updateError": "Failed to update profile"
      },
      "no": {
        "courses": "No courses yet",
        "project": "No Project",
        "projects": "No projects yet"
      },
      "view": "View",
      "editButton": "Edit",
      "loading": "Loading...",
      "customer": {
        "courses": {
          "title": "Courses",
          "active": "Active Courses",
          "available": "Available Courses",
          "enroll": "Enroll Now",
          "view": "View Details",
          "courseInfo": "Course Information",
          "duration": "Duration",
          "price": "Price",
          "type": "Type",
          "recurring": "Recurring",
          "oneTime": "One-time payment",
          "purchase": "Purchase",
          "cancel": "Cancel",
          "days": "days",
          "viewDetails": "View Details",
          "myEnrollments": "My Enrolled Courses",
          "noEnrollments": "You are not enrolled in any courses yet",
          "noEnrollmentsDescription": "Browse available courses and enroll to start learning",
          "browseCourses": "Browse Courses",
          "subscription": "Subscription",
          "startDate": "Start Date",
          "endDate": "End Date",
          "renew": "Renew Subscription"
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
        "botNameInvalid": "Bot name can only contain letters, numbers, and underscores",
        "projectNotFound": "Project not found"
      },
      "success": {
        "projectCreated": "Project created successfully!",
        "projectUpdated": "Project updated successfully!",
        "courseCreated": "Course created successfully!",
        "courseUpdated": "Course updated successfully!",
        "enrolled": "Successfully enrolled in course!",
        "socialSaved": "Social media accounts saved successfully!"
      },
      "editCourse": {
        "title": "Edit Course",
        "save": "Save Changes",
        "cancel": "Cancel",
        "success": "Course updated successfully!",
        "error": "Failed to update course"
      },
      "go": {
        "back": "Go Back"
      },
      "goBack": "Go Back",
      "login": {
        "required": "Login Required",
        "please": {
          "login": {
            "to": {
              "access": "Please log in to access this content"
            }
          }
        }
      },
      "please": {
        "login": {
          "to": {
            "access": "Please log in to access this content"
          }
        }
      },
      "cancel": "Cancel",
      "save": "Save",
      "landing": {
        "loading": "Loading...",
        "redirecting": "Redirecting to dashboard...",
        "footer": "© 2025 Paradise Knowledge Hub. All rights reserved.",
        "cta": {
          "start": "Get Started",
          "join": "Join thousands of influencers who are already scaling their business with Paradise.",
          "ready": "Ready to Start Your Journey?"
        }
      },
      "dashboard": {
        "earnings": {
          "title": "Earnings Overview",
          "earnings": "Earnings"
        }
      },
      "project": {
        "landing": {
          "benefits": {
            "title": "What You'll Gain",
            "personalized": {
              "title": "Personalized Guidance",
              "description": "Receive customized support tailored to your specific goals and challenges"
            },
            "community": {
              "title": "Community Support",
              "description": "Join a community of like-minded individuals on similar journeys"
            },
            "results": {
              "title": "Proven Results",
              "description": "Follow systems and approaches that have been proven to deliver transformative outcomes"
            }
          },
          "testimonials": {
            "title": "What Others Are Saying",
            "quote1": "This program has completely transformed my approach. The personalized guidance was exactly what I needed to make real progress.",
            "name1": "Sarah R.",
            "date1": "Joined 3 months ago",
            "quote2": "I've tried many other programs before, but the level of personalization and care in this one is unmatched. I'm seeing results I never thought possible.",
            "name2": "James T.",
            "date2": "Joined 6 months ago"
          },
          "footer": {
            "connect": "Connect With Us",
            "description": "Personalized guidance to help you achieve your goals"
          }
        }
      },
      "profile": {
        "title": "User Profile",
        "email": "Email",
        "telegram": "Telegram",
        "save": "Save Profile",
        "updateSuccess": "Profile updated successfully",
        "updateError": "Failed to update profile"
      },
      "no": {
        "courses": "No courses yet",
        "project": "No Project",
        "projects": "No projects yet"
      },
      "view": "View",
      "editButton": "Edit",
      "loading": "Loading...",
      "customer": {
        "courses": {
          "title": "Courses",
          "active": "Active Courses",
          "available": "Available Courses",
          "enroll": "Enroll Now",
          "view": "View Details",
          "courseInfo": "Course Information",
          "duration": "Duration",
          "price": "Price",
          "type": "Type",
          "recurring": "Recurring",
          "oneTime": "One-time payment",
          "purchase": "Purchase",
          "cancel": "Cancel",
          "days": "days",
          "viewDetails": "View Details",
          "myEnrollments": "My Enrolled Courses",
          "noEnrollments": "You are not enrolled in any courses yet",
          "noEnrollmentsDescription": "Browse available courses and enroll to start learning",
          "browseCourses": "Browse Courses",
          "subscription": "Subscription",
          "startDate": "Start Date",
          "endDate": "End Date",
          "renew": "Renew Subscription"
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
        "botNameInvalid": "Bot name can only contain letters, numbers, and underscores",
        "projectNotFound": "Project not found"
      },
      "success": {
        "projectCreated": "Project created successfully!",
        "projectUpdated": "Project updated successfully!",
        "courseCreated": "Course created successfully!",
        "courseUpdated": "Course updated successfully!",
        "enrolled": "Successfully enrolled in course!",
        "socialSaved": "Social media accounts saved successfully!"
      },
      "editCourse": {
        "title": "Edit Course",
        "save": "Save Changes",
        "cancel": "Cancel",
        "success": "Course updated successfully!",
        "error": "Failed to update course"
      },
      "go": {
        "back": "Go Back"
      },
      "goBack": "Go Back",
      "login": {
        "required": "Login Required",
        "please": {
          "login": {
            "to": {
              "access": "Please log in to access this content"
            }
          }
        }
      },
      "please": {
        "login": {
          "to": {
            "access": "Please log in to access this content"
          }
        }
      },
      "cancel": "Cancel",
      "save": "Save",
      "landing": {
        "loading": "Loading...",
        "redirecting": "Redirecting to dashboard...",
        "footer": "© 2025 Paradise Knowledge Hub. All rights reserved.",
        "cta": {
          "start": "Get Started",
          "join": "Join thousands of influencers who are already scaling their business with Paradise.",
          "ready": "Ready to Start Your Journey?"
        }
      },
      "dashboard": {
        "earnings": {
          "title": "Earnings Overview",
          "earnings": "Earnings"
        }
      },
      "course": {
        "duration": "Duration",
        "hours": "hours",
        "view": {
          "details": "View Course Details"
        }
      }
    }
  },
  ru: {
    translation: {
      "app": {
        "name": "Jeve",
        "tagline": "Поделитесь знаниями со всем миром"
      },
      "navigation": {
        "home": "Главная",
        "login": "Вход",
        "signup": "Регистрация",
        "logout": "Выход",
        "dashboard": "Панель управления",
        "projects": "Проекты",
        "courses": "Управлять курсами",
        "createProject": "Создать проект",
        "profile": "Профиль",
        "language": "Язык",
        "cancel": "Отмена",
        "logout_success": "Вы успешно вышли из системы",
        "logout_error": "Не удалось выйти. Пожалуйста, попробуйте снова."
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
        },
        "projects": {
          "title": "Проекты инфлюенсера"
        }
      },
      "project": {
        "manageKnowledge": "Управление знаниями",
        "knowledge": "Знания проекта",
        "addKnowledge": "Добавить знание",
        "orUploadDocuments": "Или загрузить документы",
        "noKnowledge": "К этому проекту еще не добавлены знания"
      },
      "profile": {
        "title": "Профиль пользователя",
        "email": "Эл. почта",
        "telegram": "Telegram",
        "save": "Сохранить профиль",
        "updateSuccess": "Профиль успешно обновлен",
        "updateError": "Не удалось обновить профиль"
      },
      "no": {
        "courses": "Пока нет курсов",
        "project": "Нет проекта",
        "projects": "Пока нет проектов"
      },
      "view": "Просмотр",
      "editButton": "Редактировать",
      "loading": "Загрузка...",
      "customer": {
        "courses": {
          "title": "Курсы",
          "active": "Активные курсы",
          "available": "Доступные курсы",
          "enroll": "Записаться сейчас",
          "view": "Подробнее",
          "courseInfo": "Информация о курсе",
          "duration": "Продолжительность",
          "price": "Цена",
          "type": "Тип",
          "recurring": "Повторяющийся",
          "oneTime": "Разовый платеж",
          "purchase": "Купить",
          "cancel": "Отмена",
          "days": "дней",
          "viewDetails": "Подробнее",
          "myEnrollments": "Мои курсы",
          "noEnrollments": "Вы еще не записаны ни на один курс",
          "noEnrollmentsDescription": "Просмотрите доступные курсы и запишитесь, чтобы начать обучение",
          "browseCourses": "Просмотреть курсы",
          "subscription": "Подписка",
          "startDate": "Дата начала",
          "endDate": "Дата окончания",
          "renew": "Продлить подписку"
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
        "botNameInvalid": "Имя бота может содержать только буквы, цифры и знаки подчеркивания",
        "projectNotFound": "Проект не найден"
      },
      "success": {
        "projectCreated": "Проект успешно создан!",
        "projectUpdated": "Проект успешно обновлен!",
        "courseCreated": "Курс успешно создан!",
        "courseUpdated": "Курс успешно обновлен!",
        "enrolled": "Вы успешно записались на курс!",
        "socialSaved": "Аккаунты социальных сетей успешно сохранены!"
      },
      "editCourse": {
        "title": "Редактировать курс",
        "save": "Сохранить изменения",
        "cancel": "Отмена",
        "success": "Курс успешно обновлен!",
        "error": "Не удалось обновить курс"
      },
      "go": {
        "back": "Назад"
      },
      "goBack": "Назад",
      "login": {
        "required": "Требуется вход",
        "please": {
          "login": {
            "to": {
              "access": "Пожалуйста, войдите чтобы получить доступ"
            }
          }
        }
      },
      "please": {
        "login": {
          "to": {
            "access": "Пожалуйста, войдите чтобы получить доступ"
          }
        }
      },
      "cancel": "Отмена",
      "save": "Сохранить",
      "landing": {
        "loading": "Загрузка...",
        "redirecting": "Перенаправление в панель управления...",
        "footer": "© 2025 Paradise Knowledge Hub. Все права защищены.",
        "cta": {
          "start": "Начать",
          "join": "Присоединяйтесь к тысячам инфлюенсеров, которые уже масштабируют свой бизнес с Paradise.",
          "ready": "Готовы начать свой путь?"
        }
      },
      "dashboard": {
        "earnings": {
          "title": "Обзор доходов",
          "earnings": "Доход"
        }
      },
      "project": {
        "landing": {
          "benefits": {
            "title": "Что вы получите",
            "personalized": {
              "title": "Персонализированное руководство",
              "description": "Получите индивидуальную поддержку, адаптированную к вашим конкретным целям и задачам"
            },
            "community": {
              "title": "Поддержка сообщества",
              "description": "Присоединяйтесь к сообществу единомышленников на схожем пути"
            },
            "results": {
              "title": "Проверенные результаты",
              "description": "Следуйте системам и подходам, которые доказали свою эффективность"
            }
          },
          "testimonials": {
            "title": "Что говорят другие",
            "quote1": "Эта программа полностью изменила мой подход. Персонализированное руководство - это именно то, что мне было нужно для реального прогресса.",
            "name1": "Сара Р.",
            "date1": "Присоединилась 3 месяца назад",
            "quote2": "Я пробовал много других программ раньше, но уровень персонализации и заботы в этой не имеет себе равных. Я вижу результаты, которые раньше казались невозможными.",
            "name2": "Джеймс Т.",
            "date2": "Присоединился 6 месяцев назад"
          },
          "footer": {
            "connect": "Связаться с нами",
            "description": "Персонализированное руководство, которое поможет вам достичь ваших целей"
          }
        }
      },
      "profile": {
        "title": "Профиль пользователя",
        "email": "Эл. почта",
        "telegram": "Telegram",
        "save": "Сохранить профиль",
        "updateSuccess": "Профиль успешно обновлен",
        "updateError": "Не удалось обновить профиль"
      },
      "no": {
        "courses": "Пока нет курсов",
        "project": "Нет проекта",
        "projects": "Пока нет проектов"
      },
      "view": "Просмотр",
      "editButton": "Редактировать",
      "loading": "Загрузка...",
      "customer": {
        "courses": {
          "title": "Курсы",
          "active": "Активные курсы",
          "available": "Доступные курсы",
          "enroll": "Записаться сейчас",
          "view": "Подробнее",
          "courseInfo": "Информация о курсе",
          "duration": "Продолжительность",
          "price": "Цена",
          "type": "Тип",
          "recurring": "Повторяющийся",
          "oneTime": "Разовый платеж",
          "purchase": "Купить",
          "cancel": "Отмена",
          "days": "дней",
          "viewDetails": "Подробнее",
          "myEnrollments": "Мои курсы",
          "noEnrollments": "Вы еще не записаны ни на один курс",
          "noEnrollmentsDescription": "Просмотрите доступные курсы и запишитесь, чтобы начать обучение",
          "browseCourses": "Просмотреть курсы",
          "subscription": "Подписка",
          "startDate": "Дата начала",
          "endDate": "Дата окончания",
          "renew": "Продлить подписку"
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
        "botNameInvalid": "Имя бота может содержать только буквы, цифры и знаки подчеркивания",
        "projectNotFound": "Проект не найден"
      },
      "success": {
        "projectCreated": "Проект успешно создан!",
        "projectUpdated": "Проект успешно обновлен!",
        "courseCreated": "Курс успешно создан!",
        "courseUpdated": "Курс успешно обновлен!",
        "enrolled": "Вы успешно записались на курс!",
        "socialSaved": "Аккаунты социальных сетей успешно сохранены!"
      },
      "editCourse": {
        "title": "Редактировать курс",
        "save": "Сохранить изменения",
        "cancel": "Отмена",
        "success": "Курс успешно обновлен!",
        "error": "Не удалось обновить курс"
      },
      "go": {
        "back": "Назад"
      },
      "goBack": "Назад",
      "login": {
        "required": "Требуется вход",
        "please": {
          "login": {
            "to": {
              "access": "Пожалуйста, войдите чтобы получить доступ"
            }
          }
        }
      },
      "please": {
        "login": {
          "to": {
            "access": "Пожалуйста, войдите чтобы получить доступ"
          }
        }
      },
      "cancel": "Отмена",
      "save": "Сохранить",
      "landing": {
        "loading": "Загрузка...",
        "redirecting": "Перенаправление в панель управления...",
        "footer": "© 2025 Paradise Knowledge Hub. Все права защищены.",
        "cta": {
          "start": "Начать",
          "join": "Присоединяйтесь к тысячам инфлюенсеров, которые уже масштабируют свой бизнес с Paradise.",
          "ready": "Готовы начать свой путь?"
        }
      },
      "dashboard": {
        "earnings": {
          "title": "Обзор доходов",
          "earnings": "Доход"
        }
      },
      "course": {
        "duration": "Продолжительность",
        "hours": "часов",
        "view": {
          "details": "Подробнее о курсе"
        }
      }
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
      order: ['localStorage', 'navigator'], 
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
