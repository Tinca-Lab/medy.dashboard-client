export default defineNuxtPlugin(() => {
    const app = useAppConfig();
    const config = useRuntimeConfig();
    const $api = $fetch.create({
        baseURL: config.public.baseURL,
        onRequest({request, options, error}) {
            const {authorization} = useAuth();
            if (authorization.value) {
                options.headers.set('Authorization', `Bearer ${authorization.value}`)
            }
        },
        async onResponseError({response}) {
            if (response.status === 401) {
                const auth = useAuth();
                await auth.logout();
            }
        }
    })
    // Expose to useNuxtApp().$api
    return {
        provide: {
            api: $api
        }
    }
})
