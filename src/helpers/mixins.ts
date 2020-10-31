import {Router, routesMapRule, RoutesRule} from '../options/base';
import {createRouteMap} from '../helpers/createRouteMap'
import {buildVueRoutes, buildVueRouter} from '../H5/buildRouter'
import {proxyEachHook} from '../H5/proxyHook'
import {mpPlatformReg} from './config'
import {proxyLaunchHook, registerLoddingPage} from '../app/proxyHook';

let registerRouter:boolean = false;

export function getMixins(router: Router):{
    beforeCreate(this: any): void;
} | {
    beforeCreate(): void;
} | {
    onLaunch(): void;
} {
    let platform = router.options.platform;
    if (mpPlatformReg.test(platform)) {
        platform = 'app-lets';
    }
    const toggleHooks = {
        h5: {
            beforeCreate(this: any): void {
                if (this.$options.router) {
                    router.$route = this.$options.router; // 挂载vue-router到路由对象下
                    let vueRouteMap:RoutesRule[]|RoutesRule = [];
                    if (router.options.h5?.vueRouterDev) {
                        vueRouteMap = router.options.routes;
                    } else {
                        vueRouteMap = createRouteMap(router, this.$options.router.options.routes).finallyPathMap;
                        (router.routesMap as routesMapRule).vueRouteMap = vueRouteMap;
                        buildVueRoutes(router, vueRouteMap);
                    }
                    buildVueRouter(router, this.$options.router, vueRouteMap);
                    proxyEachHook(router, this.$options.router);
                }
            }
        },
        'app-plus': {
            beforeCreate(this: any): void {
                if (!registerRouter) {
                    registerRouter = true;
                    proxyLaunchHook(this.$options, router);
                    registerLoddingPage(router, () => {

                    });
                    console.log('beforeCreate---app');
                }
            },
            onLoad():void{
                console.log('onLoad---app');
            }
        },
        'app-lets': {
            onLaunch(): void {
                console.log('beforeCreate----app-lets');
            }
        }
    };
    return toggleHooks[(platform as 'h5'|'app-plus'|'app-lets')];
}
export function initMixins(Vue: any, router: Router) {
    const routesMap = createRouteMap(router, router.options.routes);
    router.routesMap = routesMap; // 挂载自身路由表到路由对象下
    Vue.mixin({
        ...getMixins(router)
    });
}
