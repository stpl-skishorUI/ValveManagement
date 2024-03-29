import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  checkDataType(val: any) {
    let value: any;
    if (val == "" || val == null || val == "null" || val == undefined || val == "undefined" || val == 'string' || val == null || val == 0) {
      value = false;
    } else {
      value = true;
    }
    return value;
  }

  routerLinkRedirect(path: any) {
    this.router.navigate([path], { relativeTo: this.route });
  }

  onlyDigitsExcludeZeroAtStart(event: any) {
    const maskSeperator = new RegExp('^[1-9][0-9]*$', 'g');
    if(event.currentTarget.value != "" && event.currentTarget.value.length > 0 && event.key == '0') {
        return true
    }
    return maskSeperator.test(event.key);
}

//............................. Agm Map Code Start Here..........................................//

lineSymbol:any = { path: 'M 1.5 1 L 1 0 L 1 2 M 0.5 1 L 1 0',
fillColor: '#4d5ebf',strokeColor: '#4d5ebf',strokeWeight: 3,strokeOpacity: 1};

//............................. Agm Map Code End Here..........................................//

}
