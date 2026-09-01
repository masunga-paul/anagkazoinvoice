export type ServiceCategory =
	| 'Wheel Alignment & Balancing'
	| 'Truck & Fleet Tyre Care'
	| 'Fitting & Demounting'
	| 'Emergency Assistance'
	| 'Inspection & Maintenance';

export interface WorkshopService {
	id: string;
	code: string;
	title: string;
	category: ServiceCategory;
	description: string;
	estimatedMinutes: number;
	priceTZS: number;
	popular?: boolean;
	fleetEligible: boolean;
	activeBookings: number;
}
