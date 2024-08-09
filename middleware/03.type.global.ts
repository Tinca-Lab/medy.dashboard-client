export default defineNuxtRouteMiddleware(async (to) => {
    const {user, me} = useAuth();
    if (to.meta.role && !(to.meta.role as string[]).includes(user.value?.kind)) {
        abortNavigation();
    }
});
