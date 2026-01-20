Purpose:
Build a simple equipment rental website to learn the flow of how it works, React frontend -> .NET API -> Supabase DB & Image Storage

Day Counting: 
-Rental days are counted inclusive of both start_date and end_date
-For Example: Jan 10 to Jan 12 is seen as 3 rental days. 

Price Rule:
-total_price = daily_price X rental_days
- total _price is calculated within the server 

Date overlap:
-treat reservations as closed date ranges because dates are inclusive

Date overlap rule (how we block double bookings)
Treat reservations as closed date ranges because dates are inclusive.

Existing reservation: [existingStart, existingEnd]
Requested reservation: [requestedStart, requestedEnd]

Overlap condition
requestedStart <= existingEnd AND requestedEnd >= existingStart

Plain English
The new booking conflicts if it starts before an old booking ends and ends after an old booking starts.

Examples
Existing: Jan 10 to Jan 12
Requested: Jan 12 to Jan 14
Overlaps because Jan 12 is included in both.

Existing: Jan 10 to Jan 12
Requested: Jan 13 to Jan 15
No overlap.

