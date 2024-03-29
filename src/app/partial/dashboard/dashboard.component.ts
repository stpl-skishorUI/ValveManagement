import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from 'src/app/core/services/api.service';
import { CommonService } from 'src/app/core/services/common.service';
import { ErrorsService } from 'src/app/core/services/errors.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { LocalstorageService } from 'src/app/core/services/localstorage.service';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { DateTimeAdapter } from 'ng-pick-datetime';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  valveSummaryArray: any;
  getAllLocalStorageData = this.localStorage.getLoggedInLocalstorageData();
  filterForm: FormGroup | any;
  yoganaIdArray: any;
  networkIdArray: any;
  DeviceCurrentSensorArray: any;
  tankFilterDrop = new FormControl();
  chartObj: any;
  tankDeviceHourlyArray: any;
  dateFilter = new FormControl('');
  max: any = new Date();
  valveEventHourlyArray: any;

  constructor(
    public commonService: CommonService,
    public apiService: ApiService,
    private toastrService: ToastrService,
    private errorSerivce: ErrorsService,
    private spinner: NgxSpinnerService,
    private localStorage: LocalstorageService,
    private fb: FormBuilder,
    private datePipe: DatePipe,
    public dateTimeAdapter: DateTimeAdapter<any>,
  ) { dateTimeAdapter.setLocale('en-IN'); }

  ngOnInit(): void {
    this.defaultFilterForm();
    this.getYogana();
    this.waterTankChartData();
    this.localStorage.userId() == 1 ? (this.getValveSummary(), this.getValveSegmentList(), this.getDeviceCurrentSensorValue()) : '';
  }

  defaultFilterForm() {
    this.filterForm = this.fb.group({
      yojanaId: [''],
      networkId: [''],
    })
  }

  clearFilter(flag: any) {
    flag == 'yojana' ? this.filterForm.controls['networkId'].setValue('') : '';
    this.tankFilterDrop.setValue('');
    this.dateFilter.setValue('');
    this.getValveSummary(),
      this.getValveSegmentList()
    this.getDeviceCurrentSensorValue();
    this.editPatchShape = undefined;
  }

  getYogana() {
    this.apiService.setHttp('GET', 'api/MasterDropdown/GetAllYojana?YojanaId=' + this.getAllLocalStorageData.yojanaId, false, false, false, 'valvemgt');
    this.apiService.getHttp().subscribe((res: any) => {
      if (res.statusCode == "200") {
        this.yoganaIdArray = res.responseData;
        this.yoganaIdArray?.length == 1 ? (this.filterForm.patchValue({ yojanaId: this.yoganaIdArray[0].yojanaId }), this.getNetwork()) : '';
      }
      else {
        this.yoganaIdArray = [];
        this.toastrService.error(res.statusMessage);
      }
    }, (error: any) => { this.errorSerivce.handelError(error.status) })
  }

  getNetwork() {
    this.apiService.setHttp('GET', 'api/MasterDropdown/GetAllNetworkbyUserId?YojanaId=' + this.filterForm.value.yojanaId + '&UserId=' + this.localStorage.userId(), false, false, false, 'valvemgt');
    this.apiService.getHttp().subscribe((res: any) => {
      if (res.statusCode == "200") {
        this.networkIdArray = res.responseData;
        this.networkIdArray?.length == 1 ? (this.filterForm.patchValue({ networkId: this.networkIdArray[0].networkId }), this.getValveSummary(), this.getValveSegmentList(), this.getDeviceCurrentSensorValue()) : '';
        (this.yoganaIdArray?.length == 1 && this.networkIdArray?.length > 1) ? (this.getValveSummary(), this.getValveSegmentList(), this.getDeviceCurrentSensorValue()) : '';
      }
      else {
        this.networkIdArray = [];
        this.commonService.checkDataType(res.statusMessage) == false ? this.errorSerivce.handelError(res.statusCode) : '';
      }
    }, (error: any) => { this.errorSerivce.handelError(error.status) })
  }

  getValveSummary() {
    this.spinner.show();
    let obj = this.localStorage.userId() + '&YojanaId=' + (this.filterForm.value.yojanaId || 0) + '&NetworkId=' + (this.filterForm.value.networkId || 0)
    this.apiService.setHttp('get', "ValveMaster/GetValveSummary?UserId=" + obj, false, false, false, 'valvemgt');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === "200") {
          this.spinner.hide();
          this.valveSummaryArray = res.responseData;
        } else {
          this.spinner.hide();
          this.valveSummaryArray = [];
          this.commonService.checkDataType(res.statusMessage) == false ? this.errorSerivce.handelError(res.statusCode) : this.toastrService.error(res.statusMessage);
        }
      },
      error: ((error: any) => { this.errorSerivce.handelError(error.status), this.spinner.hide(); })
    });
  }

  getDeviceCurrentSensorValue() {
    this.apiService.setHttp('get', "DeviceInfo/GetDeviceCurrentSensorValue?YojanaId=" + (this.filterForm.value.yojanaId || 0) + '&NetworkId=' + (this.filterForm.value.networkId || 0), false, false, false, 'valvemgt');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === "200") {
          this.DeviceCurrentSensorArray = res.responseData;
          this.tankFilterDrop.setValue(res.responseData[0]?.tankId);
          this.waterTankChartData(res.responseData[0]);
          this.DeviceCurrentSensorArray?.length == 0 ? (this.tankDeviceHourlyArray = [], this.graphLineChart()) : '';
        } else {
          this.DeviceCurrentSensorArray = [];
          this.commonService.checkDataType(res.statusMessage) == false ? this.errorSerivce.handelError(res.statusCode) : this.toastrService.error(res.statusMessage);
        }
      }, error: ((error: any) => { this.errorSerivce.handelError(error.status) })
    });
  }

  filterTankData(obj: any) {
    if (obj[0]?.data?.tankId) {
      this.waterTankChartData(obj[0]?.data);
      this.dateFilter.setValue(this.max)
      this.getTankDeviceHourlyValue();
    }
  }

  waterTankChartData(data?: any) {
    this.chartObj = data;
    let chartData = data ? [{ "category": data.tankName, "value1": data.percentage, "value2": 0 }] : [{ "category": "", "value1": 0, "value2": 0 }];

    am4core.useTheme(am4themes_animated);
    am4core.addLicense("ch-custom-attribution");

    // Create chart instance
    var chart = am4core.create("valveCylenderChart", am4charts.XYChart);
    chart.data = chartData;
    var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "category";
    categoryAxis.renderer.grid.template.location = 0;
    categoryAxis.renderer.minGridDistance = 30;
    categoryAxis.renderer.ticks.template.disabled = false;
    categoryAxis.renderer.ticks.template.strokeOpacity = 0.5;
    // categoryAxis.title.text = "Water Tank Name";

    var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.max = 100;
    valueAxis.min = 0;
    // valueAxis.strictMinMax = true; 
    valueAxis.calculateTotals = true;
    valueAxis.title.text = "Water Level In Percentage";

    valueAxis.renderer.labels.template.adapter.add("text", function (text: any) {
      if ((text > 100) || (text < 0)) { return ""; }
      else { return text + "%"; }
    })

    // Create series
    function createSeries(open: any, close: any) {
      var series: any = chart.series.push(new am4charts.ColumnSeries());
      series.dataFields.valueY = close;
      series.dataFields.openValueY = open;
      series.dataFields.categoryX = "category";
      series.clustered = false;
      // series.strokeWidth = 0;
      series.columns.template.width = am4core.percent(100);

      var labelBullet = series.bullets.push(new am4charts.LabelBullet());
      labelBullet.label.hideOversized = true;
      labelBullet.label.fill = am4core.color("#fff");
      labelBullet.label.adapter.add("text", function (text: any, target: any) {
        var val = Math.abs(target.dataItem.valueY - target.dataItem.openValueY);
        return val + '% Water';
      });
      labelBullet.locationY = 0.5;


    }

    createSeries("value2", "value1");
  }

  getTankDeviceHourlyValue() {
    let obj: any = this.chartObj?.deviceId + '&DisplayDate=' + this.datePipe.transform(this.dateFilter.value, 'yyyy/MM/dd') + '&YojanaId=' + (this.filterForm.value.yojanaId || 0) + '&NetworkId=' + (this.filterForm.value.networkId || 0)
    this.apiService.setHttp('get', "DeviceInfo/GetTankDeviceHourlyValueWithEvent?DeviceId=" + obj, false, false, false, 'valvemgt');
    this.apiService.getHttp().subscribe({
      next: (res: any) => {
        if (res.statusCode === "200") {
          // percent hourValue
          this.tankDeviceHourlyArray = res.responseData[0].tankSensorValues;
          this.tankDeviceHourlyArray.map((ele: any) => { ele['value1'] = ele.percent})
          this.valveEventHourlyArray = res.responseData[0].valveEvent;
          this.valveEventHourlyArray.map((ele: any) => {  ele['value2'] = ele.percent })

          this.graphLineChart();
        } else {
          this.tankDeviceHourlyArray = [];
          this.commonService.checkDataType(res.statusMessage) == false ? this.errorSerivce.handelError(res.statusCode) : this.toastrService.error(res.statusMessage);
        }
      },
      error: ((error: any) => { this.errorSerivce.handelError(error.status) })
    });
  }

  graphLineChart() {
    am4core.useTheme(am4themes_animated);
    let chart = am4core.create("chartdiv", am4charts.XYChart);
    chart.colors.step = 2;

    let mainArray = this.tankDeviceHourlyArray.concat(this.valveEventHourlyArray);
    
    chart.data = mainArray;  // Add data
    chart.scrollbarX = new am4core.Scrollbar();
    chart.scrollbarX.interactionsEnabled = false;

    // Create axes
    let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    categoryAxis.dataFields.category = "hourValue";
    categoryAxis.title.text = "Time";
    categoryAxis.renderer.grid.template.location = 0;
    categoryAxis.renderer.minGridDistance = 100;
    categoryAxis.startLocation = 0.5;
    categoryAxis.endLocation = 0.5;

    categoryAxis.startLocation = 0;
    categoryAxis.endLocation = 1;

    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.title.text = "Water Level In Percentage";
    valueAxis.calculateTotals = true;
    valueAxis.min = 0;
    valueAxis.max = 100;
    valueAxis.strictMinMax = true;
    valueAxis.renderer.labels.template.adapter.add("text", function (text) {
      return text + "%";
    });

    let series: any = chart.series.push(new am4charts.LineSeries()); // Create series
    series.dataFields.valueY = "value1";
    series.dataFields.dateX = "totalPercent";
    series.dataFields.categoryX = "hourValue";
    series.name = "Percent";
    series.strokeWidth = 3;
    series.fillOpacity = 0.85;
    // series.stacked = true;
    series.tooltip.getFillFromObject = false;
    series.tooltip.background.fill = am4core.color("#FFF");
    series.tooltip.getStrokeFromObject = true;
    series.tooltip.background.strokeWidth = 3;

    var bullet = series.bullets.push(new am4charts.CircleBullet());
    bullet.circle.radius = 6;
    bullet.circle.fill = am4core.color("#fff");
    bullet.circle.strokeWidth = 3;

    var series2 = chart.series.push(new am4charts.LineSeries());
    series2.dataFields.valueY = "value2";
    series2.dataFields.dateX = "totalPercent";
    series2.dataFields.categoryX = "hourValue";
    series2.strokeWidth = 0;
    series2.fillOpacity = 0;
    series2.stroke = am4core.color("white");

    let bullet2:any = series2.bullets.push(new am4charts.CircleBullet());
    bullet2.circle.radius = 6;
    bullet2.circle.fill = am4core.color("red");
    bullet2.circle.strokeWidth = 3;

    // // static
    // series.legendSettings.labelText = "Water Level:";
    // series.legendSettings.valueText = "{valueY.close}";

    // // hovering
    // series.legendSettings.itemLabelText = "Water:";
    // series.legendSettings.itemValueText = "{valueY}";

    chart.cursor = new am4charts.XYCursor(); // Add cursor
    // chart.legend = new am4charts.Legend(); // add legend
  }

  //..................................................... new Code StartHere ..................... ...............//

  valveSegmentList: any;
  zoom = 6;
  editPatchShape: undefined | any;
  tank_ValveArray: any;
  getAllSegmentArray: any[] = [];
  map: any;
  markerArray: any;
  markerUrlNull = "../../../../assets/images/dot.png";
  Polyline: any[] = [];
  latitude:number = 19.0898177;
  logitude:number = 76.5240298;

  getValveSegmentList() { //All Segment 
    setTimeout(() => {
      this.spinner.show();
      let obj: any = 'YojanaId=' + (this.filterForm.value.yojanaId || 0) + '&NetworkId=' + (this.filterForm.value.networkId || 0)
        + '&userId=' + this.localStorage.userId();
      this.apiService.setHttp('get', 'ValveTankSegment/GetValveSegmentList?' + obj, false, false, false, 'valvemgt');
      this.apiService.getHttp().subscribe({
        next: (res: any) => {
          if (res.statusCode === '200') {
            this.spinner.hide();
            this.valveSegmentList = res.responseData[0];
            this.valveSegPatchData(this.valveSegmentList);
          } else {
            this.spinner.hide();
            this.valveSegmentList = [];
            this.valveSegmentList = '';
            this.commonService.checkDataType(res.statusMessage) == false ? this.errorSerivce.handelError(res.statusCode) : '';
          }
        },
        error: (error: any) => { this.errorSerivce.handelError(error.status) }
      });
    }, 100);
  }

  valveSegPatchData(mainArray: any) {
    this.markerArray = mainArray.segmenDetailsModels.map((ele: any) => { //Marker show Code
      return ele = { latitude: ele.startPoints.split(' ')[0], longitude: ele.startPoints.split(' ')[1], label: ele.segmentName };
    })

    mainArray.tankDetailsModels.map((ele: any) => { // Insert Tank Img
      ele['iconUrl'] = "../../../../assets/images/tank2.png";
      ele['flag'] = 'tank';
      return ele
    })

    mainArray.valveDetailModels.map((ele: any) => { // Insert valve Img
      ele['iconUrl'] = "../../../../assets/images/valve2.png";
      ele['flag'] = 'valve';
      return ele
    })

    this.tank_ValveArray = mainArray.tankDetailsModels.concat(mainArray.valveDetailModels);

    this.getAllSegmentArray = mainArray.segmenDetailsModels.map((ele: any) => {
      let stringtoArray = ele.midpoints.split(',');
      let finalLatLngArray = stringtoArray.map((ele: any) => { return ele = { lat: Number(ele.split(' ')[0]), lng: Number(ele.split(' ')[1]) } });
      return ele = finalLatLngArray;
    })
    this.onMapReady(this.map);
  }

  onMapReady(map: any) {
    map?.setOptions({ mapTypeControlOptions: { position: google.maps.ControlPosition.TOP_RIGHT }, streetViewControl: false });// add satellite view btn
    this.map = map;

    const bounds = new google.maps.LatLngBounds();
    this.getAllSegmentArray?.map((ele: any) => {
      this.editPatchShape = new google.maps.Polyline({
        path: ele,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        icons: [{ icon: this.commonService.lineSymbol, offset: '25px', repeat: '100px' }]
      });
      ele.forEach((marker:any) => {bounds.extend(new google.maps.LatLng(marker.lat, marker.lng))});
      this.map.fitBounds(bounds);
      this.editPatchShape.setMap(this.map);
      this.Polyline.push(this.editPatchShape);
    })
    
  }

  previous: any;
  clickedMarker(infowindow: any) {
    if (this.previous) { this.previous.close() }
    this.previous = infowindow;
  }

  clearMapData() {
    this.map.setZoom(6);this.map.setCenter({ lat: this.latitude, lng: this.logitude })
    for (let i = 0; i < this.Polyline.length; i++) {
      this.Polyline[i].setMap(null);
    }
  }

}
