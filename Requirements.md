# NatPower Loans and Inter Company Transfers

## Summary Reuqirements

Management of Loans and scheduled payments between subdivisions within the group.
SQL Backend Database with API Calls with Mock data to simulate database.
Frontend React Typescript with Microsoft Single Sign on but with mock user login.
Full history capture of every change into a log for each loan fascility.

## Formats
Dates should be shown as dd/mm/yyyy
Currency should be shown with no currency symbol, comma for thousands separator and 2 decimal places.
Currency Integer should be shown with no currency symbol, comma for thousands separator and 0 decimal places


## Pages

Admin page to manage list of companies with CRUD controls

Loan Fascility Page to manage loans.


Each Loan Fascility will have:
CRUD functionalty to create and edit a Loan Fascility with a drop down to select each one.

Loan Information:
    Lender selected from the companies list
    Borower selected from the companies list
    Agreement Date
    Currency (GBP, EUR, USD, YEN)
    Annual Interest Rate as %
    Days in Year: default to 365

There will then be a table for each Loan fascility with full CRUD capability for the Draw Down Schedule:

Column Heading          Format
Start Date              Date (dd/mm/yyyy)
End Date                Date (dd/mm/yyyy)          
Days                    Integer calculated (End Date - Start Date)

Draw Down               Currency no currency symbol, comma thousands separator and 2dp
Repayment               Currency no currency symbol, comma thousands separator and 2dp
Principal               Calculated Draw Down - Repayment
Cumulative Principal    Calculated running total sum of Principal
Interest                Currency caclulated field 
                        ((Cumulative Principal* Annual Interest Rate)/Days in Year)*Days)
Cumulative Interest     Calculated running total sum of Interest
Total                   Calculated running total sum of Cumulative Principal + Cumulcative Interest
Fees                    Currency no currency symbol, comma thousands separator and 2dp




