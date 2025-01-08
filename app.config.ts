export default defineAppConfig({
    ui: {
        primary: 'teal',
        gray: 'neutral',
        notifications: {
            position: 'top-0 bottom-auto',
        },
        container: {
            base: 'm-0',
            padding: 'p-4 sm:p-4 lg:p-4'
        },
        select: {
            default: {
                size: 'lg',
            },
            rounded: 'rounded-xl',
        },
        input: {
            default: {
                size: 'lg',
            },
            rounded: 'rounded-xl',
        },
        button: {
            rounded: 'rounded-xl',
            default: {
                size: 'lg',
            }
        }
    },
    auth: {
        redirect: {
            login: '/login',
            register: '/register',
            root: '/',
        }
    }
});
