import type {CookieRef} from "#app";
import type {Ref} from "vue";
import type {RuntimeConfig} from "nuxt/schema";

export const useAuth = (): {
    loggedIn: Ref<boolean>;
    user: Ref<{
        name: string;
        lastname: string;
        email: string;
        password: string;
        permissions: string[];
        kind: string;
        tenantId: string;
    }>;
    busy: Ref<boolean>;
    authorization: CookieRef<string | null | undefined>;
    login: ({email, password}: { email: string, password: string }, redirect?: string) => Promise<void>;
    logout: () => Promise<void>;
    me: () => Promise<void>;
} => {

    const authorization: CookieRef<string | null | undefined> = useCookie('access_token');
    const toast = useToast();
    const runtimeConfig: RuntimeConfig = useRuntimeConfig();
    const loggedIn: Ref<boolean> = useState<boolean>('loggedIn', (): boolean => false);
    const user: Ref<any> = useState<any | null>('user', (): null => null);
    const busy: Ref<boolean> = useState<boolean>('busy', (): boolean => false);


    const login = async ({email, password}: { email: string, password: string }, redirect?: string): Promise<void> => {
        busy.value = true;
        try {
            const {access_token} = await $fetch<{ access_token: string }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({email, password}),
                baseURL: runtimeConfig.public.baseURL,
            });
            authorization.value = access_token;
            busy.value = false;
            toast.add({
                title: '¡Bienvenid@!',
                description: 'Has iniciado sesión correctamente.',
                color: 'green',
            });
            navigateTo(redirect ?? '/');
        } catch (error: null | undefined | any) {
            busy.value = false;
            toast.add({
                title: '¡Ups!',
                description: error.data.message ?? 'Ha ocurrido un error inesperado al inicar sesión.',
                color: 'red',
            })
        }
    };

    const logout = async (): Promise<void> => {
        authorization.value = null;
        user.value = null;
        busy.value = false;
        loggedIn.value = false;
        if (process.client) {
            window.location.reload();
        }
    };

    const me = async (): Promise<void> => {
        busy.value = true;
        try {
            const data = await $fetch<any>('/auth/user', {
                method: 'GET',
                baseURL: runtimeConfig.public.baseURL,
                headers: {
                    Authorization: `Bearer ${authorization.value}`,
                }
            });
            loggedIn.value = true;
            user.value = data;
            busy.value = false;
        } catch {
            await logout();
        }
    };


    return {
        loggedIn,
        user,
        busy,
        authorization,
        login,
        logout,
        me,
    }
};
