import { NgModule, Inject, Optional, SkipSelf } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UniversalModule, isBrowser, isNode } from 'angular2-universal/node'; // for AoT we need to manually split universal packages

import { HomeModule } from './+home/home.module';
import { AboutModule } from './+about/about.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from './shared/shared.module';
import { CacheService } from './shared/cache.service';

// import * as LRU from 'modern-lru';

export function getLRU(lru?: any) {
  // use LRU for node
  // return lru || new LRU(10);
  return lru || new Map();
}
export function getRequest() {
  return Zone.current.get('req') || {};
}
export function getResponse() {
  return Zone.current.get('res') || {};
}

@NgModule({
  bootstrap: [ AppComponent ],
  declarations: [ AppComponent ],
  imports: [
    UniversalModule, // NodeModule, NodeHttpModule, and NodeJsonpModule are included
    FormsModule,

    SharedModule.forRoot(),
    HomeModule,
    AboutModule,

    AppRoutingModule
  ],
  providers: [
    { provide: 'isBrowser', useValue: isBrowser },
    { provide: 'isNode', useValue: isNode },

    { provide: 'req', useFactory: getRequest },
    { provide: 'res', useFactory: getResponse },

    {
      provide: 'LRU',
      useFactory: getLRU,
      deps: [ [new Inject('LRU'), new Optional(), new SkipSelf()] ]
    },

    CacheService
  ]
})
export class MainModule {
  constructor(public cache: CacheService) {

  }

  /**
   * We need to use the arrow function here to bind the context as this is a gotcha
   * in Universal for now until it's fixed
   */
  universalDoDehydrate = (universalCache) => {
    universalCache[CacheService.KEY] = JSON.stringify(this.cache.dehydrate());
  }

 /**
  * Clear the cache after it's rendered
  */
  universalAfterDehydrate = () => {
    // comment out if LRU provided at platform level to be shared between each user
    this.cache.clear();
  }
}
