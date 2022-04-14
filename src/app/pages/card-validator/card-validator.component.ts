import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmationDialogComponent } from 'src/app/modules/confirmation-dialog/confirmation-dialog.component';
import { DialogComponent } from 'src/app/pages/card-validator/dialog/dialog.component';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-card-validator',
  templateUrl: './card-validator.component.html',
  styleUrls: ['./card-validator.component.scss']
})
export class CardValidatorComponent implements OnInit {

  constructor(public dialog: MatDialog, private API: ApiService) { }

  @ViewChild('cardTable')
  cardTableSort!: MatSort;
  @ViewChild('cardTablePaginator')
  cardTablePaginator!: MatPaginator;


  // @ViewChild('bannedCountryTable')
  // bannedCountryTableSort!: MatSort;
  @ViewChild('bannedCountryTablePaginator')
  bannedCountryTablePaginator!: MatPaginator;

  cardTableColumns: string[] = ['cardNumber', 'provider', 'country', 'actions']
  cardTableData: any[] = []
  cardTableDataSource = new MatTableDataSource<{}>(this.cardTableData)

  bannedCountryTableColumns: string[] = ['country', 'actions']
  bannedCountryTableData: any[] = []
  bannedCountryTableDataSource = new MatTableDataSource<{}>(this.bannedCountryTableData)

  selectedCountryToBan: string = ""

  countries: { name: string; code: string; }[] = []

  ngOnInit(): void {
    this.getCardTableData()
    this.getBannedCountries()

    this.countries = this.API.getAllCountries()
  }

  ngAfterViewInit() {
    this.cardTableDataSource.paginator = this.cardTablePaginator;
    this.bannedCountryTableDataSource.paginator = this.bannedCountryTablePaginator;

    this.cardTableDataSource.sort = this.cardTableSort;
  }

  applyCardFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.cardTableDataSource.filter = filterValue.trim().toLowerCase();

    if (this.cardTableDataSource.paginator) {
      this.cardTableDataSource.paginator.firstPage();
    }
  }

  getCardTableData() {
    this.cardTableData = []
    let store = this.API.getAllValidatedCards()

    store.forEach((val) => {
      this.cardTableData.push(JSON.parse(val))
    });

    this.cardTableDataSource = new MatTableDataSource<{}>(this.cardTableData)
    this.cardTableDataSource.paginator = this.cardTablePaginator;
    this.cardTableDataSource.sort = this.cardTableSort;
  }

  clearDB() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent,
      { data: "Are you sure you want to delete the entire card collection?" });

    dialogRef.afterClosed().subscribe(result => {
      result == true ? (
        this.API.deleteAll(),
        this.getCardTableData()
      ) : null
    });
  }

  getBannedCountries() {
    this.bannedCountryTableData = []
    let store = this.API.getAllBannedCountries()

    store.forEach((val) => {
      this.bannedCountryTableData.push(val)
    });

    this.countries = this.countries.filter((value) => {
      return !this.bannedCountryTableData.includes(value.name);
    });

    this.selectedCountryToBan = ''

    this.bannedCountryTableDataSource = new MatTableDataSource<{}>(this.bannedCountryTableData)
    this.bannedCountryTableDataSource.paginator = this.bannedCountryTablePaginator;
  }

  editCardNumber(cardDetails: any) {
    this.openCardValidatorDialog(cardDetails)
  }

  checkIfAddedThisSession(cardNumber: string){
    return sessionStorage.getItem("cardNumber_" + cardNumber)
  }

  deleteCardNumber(cardDetails: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent,
      { data: "Are you sure you want to delete card with number: " + cardDetails.cardNumber });

    dialogRef.afterClosed().subscribe(result => {
      result == true ? (
        this.API.removeValidatedCard(cardDetails.cardNumber),
        this.getCardTableData()
      ) : null
    });
  }

  deleteBannedCountry(country: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent,
      { data: "Are you sure you want to remove " + country + " from the Banned Country List" });

    dialogRef.afterClosed().subscribe(result => {
      result == true ? (
        this.API.removeBannedCountry(country),
        this.getBannedCountries()
      ) : null
    });
  }

  openCardValidatorDialog(dataToEdit?: any) {
    const dialogRef = this.dialog.open(DialogComponent,
      { data: dataToEdit ? dataToEdit : null });

    dialogRef.afterClosed().subscribe(result => {
      this.getCardTableData()
    });
  }

  throwExisitingCardsWarning(cardNumbers: string[], country: string) {

    let message = ""

    cardNumbers.length == 1 ?
      message = "There is " + cardNumbers.length + " card which is validated with the country you have selected, proceeding will remove it from the Validation Database. Do you want to proceed?" :
      message = "There are " + cardNumbers.length + " cards which are validated with the country you have selected, proceeding will remove them from the Validation Database. Do you want to proceed?"

    const dialogRef2 = this.dialog.open(ConfirmationDialogComponent,
      { data: message });

    dialogRef2.afterClosed().subscribe((result: boolean) => {
      if (result == true) {
        cardNumbers.forEach((cardNumber: string) => {
          this.API.removeValidatedCard(cardNumber)
        })

        this.API.insertBannedCountry(country)
        this.getBannedCountries()
        this.getCardTableData()
      }
    });
  }

  addToBannedCountries(country: string) {

    this.bannedCountryTableData.indexOf(country) ? null : null

    let storeOfExistingCards: string[] = []
    this.cardTableData.forEach((entry: { country: string, cardNumber: string, provider: string }) => {
      entry.country == country ? storeOfExistingCards.push(entry.cardNumber) : null
    });

    storeOfExistingCards.length > 0 ?
      this.throwExisitingCardsWarning(storeOfExistingCards, country)
      :
      this.API.insertBannedCountry(country)


    this.getBannedCountries()
    this.getCardTableData()
  }

}
