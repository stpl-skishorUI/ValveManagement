import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MapsAPILoader } from '@agm/core';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from 'src/app/core/services/api.service';
import { CommonService } from 'src/app/core/services/common.service';
import { ErrorsService } from 'src/app/core/services/errors.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { LocalstorageService } from 'src/app/core/services/localstorage.service';

@Component({
  selector: 'app-segment-master',
  templateUrl: './segment-master.component.html',
  styleUrls: ['./segment-master.component.css']
})
export class SegmentMasterComponent implements OnInit {


  // segmentMasterForm: FormGroup | any;
  // submitted = false;
  btnText = 'Save Changes';
  segmentMasterArray: any;
  pageNumber: number = 1;
  pagesize: number = 10;
  totalRows: any;
  lat: any = 19.7515;
  lng: any = 75.7139;
  getAllLocalStorageData = this.localStorage.getLoggedInLocalstorageData();
  deleteSegmentId: any;
  @ViewChild('addSegmentModel') addSegmentModel: any;

  constructor(
    private mapsAPILoader: MapsAPILoader,
    public commonService: CommonService,
    public apiService: ApiService,
    private toastrService: ToastrService,
    private errorSerivce: ErrorsService,
    // private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private localStorage: LocalstorageService
  ) { }

  ngOnInit(): void {
    this.getAllSegmentMaster();
  }

  getAllSegmentMaster() {
    this.spinner.show();
    let obj: any = 'YojanaId=' + this.getAllLocalStorageData.yojanaId + '&NetworkId=' + this.getAllLocalStorageData.networkId;
    this.apiService.setHttp('get', 'api/SegmentMaster/GetAll?' + obj, false, false, false, 'valvemgt');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === '200') {
          this.spinner.hide();
          this.segmentMasterArray = res.responseData;
        } else {
          this.spinner.hide();
          this.segmentMasterArray = [];
          this.commonService.checkDataType(res.statusMessage) == false ? this.errorSerivce.handelError(res.statusCode) : '';
        }
      },
      error: (error: any) => {
        this.errorSerivce.handelError(error.status);
      },
    });
  }

  onSubmit() {
      let obj = {
        "id": 0,
        "segmentName": "string",
        "startPoints": "string",
        "endPoints": "string",
        "midpoints": "string",
        "createdBy": this.localStorage.userId(),
        "createdDate": new Date(),
        "modifiedby": this.localStorage.userId(),
        "modifiedDate": new Date(),
        "isDeleted": false,
        "timestamp": new Date(),
        "yojanaId": this.getAllLocalStorageData.yojanaId,
        "networkId": this.getAllLocalStorageData.networkId
      }

      this.spinner.show();
      
      let id:any;
      let urlType = id == 0 ? 'POST' : 'PUT';
      let UrlName = id == 0 ? 'api/SegmentMaster/Add' : 'api/SegmentMaster/Update';
      this.apiService.setHttp(urlType,UrlName,false,JSON.stringify(obj),false,'valvemgt');
      this.apiService.getHttp().subscribe(
        (res: any) => {
          if (res.statusCode == '200') {
            this.spinner.hide();
            this.toastrService.success(res.statusMessage);
            this.addSegmentModel.nativeElement.click();
            this.getAllSegmentMaster();
          } else {
            this.toastrService.error(res.statusMessage);
            this.spinner.hide();
          }
        },
        (error: any) => {
          this.errorSerivce.handelError(error.status);
          this.spinner.hide();
        }
      );
  }


  deleteConformation(id: any) {
    this.deleteSegmentId = id;
  }

  deleteSegMaster() {
    let obj = {
      id: parseInt(this.deleteSegmentId),
      deletedBy: this.localStorage.userId(),
    };
    this.apiService.setHttp('DELETE', 'api/SegmentMaster', false, JSON.stringify(obj), false, 'valvemgt');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === '200') {
          this.toastrService.success(res.statusMessage);
          this.getAllSegmentMaster();
          // this.clearForm();
        } else {
          this.commonService.checkDataType(res.statusMessage) == false ? this.errorSerivce.handelError(res.statusCode) : this.toastrService.error(res.statusMessage);
        }
      },
      error: (error: any) => {
        this.errorSerivce.handelError(error.status);
      },
    });
  }

}
