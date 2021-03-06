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
  selector: 'app-valve-list',
  templateUrl: './valve-list.component.html',
  styleUrls: ['./valve-list.component.css'],
})
export class ValveListComponent implements OnInit {
  valveListForm: FormGroup | any;
  submitted = false;
  btnText = 'Save Changes';
  headingText = 'Add Valve';
  valveStatusArray: any;
  pageNumber: number = 1;
  pagesize: number = 10;
  totalRows: any;
  @ViewChild('addValveModel') addValveModel: any;
  @ViewChild('addValveModal', {static: false}) addValveModal: any;
  HighlightRow!: number;
  deleteValveId: any;

  lat: any = 19.7515;
  lng: any = 75.7139;

  geoCoder: any;
  constructor(
    private mapsAPILoader: MapsAPILoader,
    public commonService: CommonService,
    public apiService: ApiService,
    private toastrService: ToastrService,
    private errorSerivce: ErrorsService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private localStorage: LocalstorageService
  ) {}

  ngOnInit() {
    this.defaultForm();
    this.getAllValveData();
    this.mapsAPILoader.load().then(() => {
      this.geoCoder = new google.maps.Geocoder();
    });
  }

  get f() {
    return this.valveListForm.controls;
  }

  defaultForm() {
    this.valveListForm = this.fb.group({
      Id: [0],
      valveName: [
        '',
        [
          Validators.required,
          Validators.pattern(
            '^[^\\s0-9\\[\\[`&._@#%*!+"\'/\\]\\]{}][a-zA-Z.\\s]+$'
          ),
        ],
      ],
      pipeDiameter: [
        '',
        [Validators.required, Validators.pattern('^[0-9.]*$')],
      ],
      noOfConnections: [
        '',
        [Validators.required, Validators.pattern('^[0-9]*$')],
      ],
      address: ['', [Validators.required]],
      valveId: [
        '',
        [Validators.required, Validators.pattern('^[^[ ]+|[ ][gm]+$')],
      ],
      companyName: [
        '',
        [
          Validators.required,
          Validators.pattern(
            '^[^\\s0-9\\[\\[`&._@#%*!+"\'/\\]\\]{}][a-zA-Z.\\s]+$'
          ),
        ],
      ],
      description: [
        '',
        [Validators.required, Validators.pattern('^[^[ ]+|[ ][gm]+$')],
      ],
    });
  }

  clearForm() {
    this.submitted = false;
    this.defaultForm();
    this.btnText = 'Save Changes';
    this.headingText = 'Add Valve';
  }

  getAllValveData() {
    this.spinner.show();
    let obj = 'UserId=' + this.pageNumber + '&Search=' + this.pagesize;
    this.apiService.setHttp(
      'get',
      'ValveMaster/GetAllValveStatus?',
      false,
      false,
      false,
      'valvemgt'
    );
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === '200') {
          this.spinner.hide();
          this.valveStatusArray = res.responseData;
          // this.valveStatusArray = res.responseData.responseData1;
          // this.totalRows = res.responseData.responseData2.totalPages * this.pagesize;
        } else {
          this.spinner.hide();
          this.valveStatusArray = [];
          this.commonService.checkDataType(res.statusMessage) == false
            ? this.errorSerivce.handelError(res.statusCode)
            : this.toastrService.error(res.statusMessage);
        }
      },
      error: (error: any) => {
        this.errorSerivce.handelError(error.status);
      },
    });
  }

  onClickPagintion(pageNo: any) {
    this.pageNumber = pageNo;
    this.getAllValveData();
  }

  onSubmit() {
    let formData = this.valveListForm.value;
    this.submitted = true;
    if (this.valveListForm.invalid) {
      return;
    } else {
      let obj = {
        id: formData.Id,
        valveName: formData.valveName,
        valveId: formData.valveId,
        companyName: formData.companyName,
        description: formData.description,
        createdBy: this.localStorage.userId(),
        statusId: 0,
        valveStatus: '',
        statusDate: new Date(),
        valvePipeDiameter:formData.pipeDiameter,
        noOfConnection:formData.noOfConnections,
        simid:0,
        latitude:this.lat,
        longitude:this.lng,
        simNo:'',
        valveAddress:formData.address
      };
      this.spinner.show();
      let urlType;
      formData.Id == 0 ? (urlType = 'POST') : (urlType = 'PUT');
      this.apiService.setHttp(
        urlType,
        'ValveMaster',
        false,
        JSON.stringify(obj),
        false,
        'valvemgt'
      );
      this.apiService.getHttp().subscribe(
        (res: any) => {
          if (res.statusCode == '200') {
            this.spinner.hide();
            this.toastrService.success(res.statusMessage);
            this.addValveModel.nativeElement.click();
            this.getAllValveData();
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
  }

  updateValveData(obj: any) {
    this.btnText = 'Update Changes';
    this.headingText = 'Update Valve';
    this.HighlightRow = obj.id;
    this.valveListForm.patchValue({
      Id: obj.id,
      valveName: obj.valveName,
      valveId: obj.valveId,
      companyName: obj.companyName,
      description: obj.description,
    });
  }

  deleteConformation(id: any) {
    this.HighlightRow = id;
    this.deleteValveId = id;
  }

  deleteJobPost() {
    let obj = {
      id: parseInt(this.deleteValveId),
      deletedBy: this.localStorage.userId(),
    };
    this.apiService.setHttp(
      'DELETE',
      'ValveMaster',
      false,
      JSON.stringify(obj),
      false,
      'valvemgt'
    );
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === '200') {
          this.toastrService.success(res.statusMessage);
          this.getAllValveData();
          this.clearForm();
        } else {
          this.commonService.checkDataType(res.statusMessage) == false
            ? this.errorSerivce.handelError(res.statusCode)
            : this.toastrService.error(res.statusMessage);
        }
      },
      error: (error: any) => {
        this.errorSerivce.handelError(error.status);
      },
    });
  }

  refreshValveStatus() {
    this.spinner.show();
    this.apiService.setHttp(
      'get',
      'ValveMaster/RefreshValveStatus?UserId=' + this.localStorage.userId(),
      false,
      false,
      false,
      'valvemgt'
    );
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === '200') {
          this.spinner.hide();
          this.getAllValveData();
          // this.valveStatusArray = res.responseData;
        } else {
          this.spinner.hide();
          // this.valveStatusArray = [];
          this.commonService.checkDataType(res.statusMessage) == false
            ? this.errorSerivce.handelError(res.statusCode)
            : this.toastrService.error(res.statusMessage);
        }
      },
      error: (error: any) => {
        this.errorSerivce.handelError(error.status), this.spinner.hide();
      },
    });
  }

  getAddress(event: any) {
    this.lat = event.coords.lat;
    this.lng = event.coords.lng;
    this.geoCoder.geocode(
      { location: { lat: this.lat, lng: this.lng } },
      (results: any, status: any) => {
        if (status === 'OK') {
          if (results[0]) {
            this.addValveModal.nativeElement.click();
            this.valveListForm.patchValue({
              address:results[0].formatted_address
            })
          } else {
            console.log('No results found');
          }
        }
      }
    );
  }
}
