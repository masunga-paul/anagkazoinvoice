import type { Customer } from '$lib/types/customer';
import type { WorkshopService } from '$lib/types/service';
import type { BrandShare, MonthlyRevenue, TopProduct, InvoiceStatusMetric } from '$lib/types/report';
import type { PaymentDetail } from '$lib/types/payment';
import type { InvoiceItem } from '$lib/types/invoice';

export const MOCK_CUSTOMERS: Customer[] = [
	{
		id: 'CUST-001',
		name: 'Tanzania Safari Logistics Ltd',
		companyName: 'Tanzania Safari Logistics Ltd',
		contactPerson: 'Godfrey Mrema',
		email: 'gmrema@safarilogistics.co.tz',
		phone: '+255 754 112 233',
		address: 'Samora Avenue, Clock Tower Roundabout, P.O. Box 4521',
		city: 'Dar es Salaam',
		customerType: 'Fleet & Logistics',
		totalPurchases: 48500000,
		outstandingBalance: 13375000,
		invoicesCount: 14,
		creditLimit: 60000000,
		paymentTerms: 'Net 14',
		tin: '102-482-901',
		status: 'Pending'
	},
	{
		id: 'CUST-002',
		name: 'Bakhresa Transport & Haulage Ltd',
		companyName: 'Bakhresa Transport & Haulage Ltd',
		contactPerson: 'Said Salim Bakhresa',
		email: 'transport@bakhresa.com',
		phone: '+255 22 286 1120',
		address: 'Tazara Industrial Zone, Mandela Road, P.O. Box 2517',
		city: 'Dar es Salaam',
		customerType: 'Fleet & Logistics',
		totalPurchases: 142000000,
		outstandingBalance: 32400000,
		invoicesCount: 38,
		creditLimit: 150000000,
		paymentTerms: 'Net 14',
		tin: '100-291-884',
		status: 'Pending'
	},
	{
		id: 'CUST-003',
		name: 'Kilimanjaro Mining & Exploration Ltd',
		companyName: 'Kilimanjaro Mining & Exploration Ltd',
		contactPerson: 'Flora Temu',
		email: 'procurement@kilimining.co.tz',
		phone: '+255 784 900 120',
		address: 'Ali Hassan Mwinyi Road, Oysterbay, P.O. Box 9012',
		city: 'Dar es Salaam',
		customerType: 'Corporate',
		totalPurchases: 78000000,
		outstandingBalance: 0,
		invoicesCount: 19,
		creditLimit: 80000000,
		paymentTerms: 'Due on Receipt',
		tin: '108-773-451',
		status: 'Paid'
	},
	{
		id: 'CUST-004',
		name: 'Mo Dewji Fleet Operations',
		companyName: 'MeTL Group Automotive Fleet',
		contactPerson: 'Hassan Dewji',
		email: 'fleet@metl.net',
		phone: '+255 713 440 000',
		address: 'MeTL Tower, Indira Gandhi Street',
		city: 'Dar es Salaam',
		customerType: 'Fleet & Logistics',
		totalPurchases: 215000000,
		outstandingBalance: 18500000,
		invoicesCount: 52,
		creditLimit: 250000000,
		paymentTerms: 'Net 14',
		tin: '101-502-399',
		status: 'Pending'
	},
	{
		id: 'CUST-005',
		name: 'Serengeti Express Coach Lines',
		companyName: 'Serengeti Express Coach Lines Ltd',
		contactPerson: 'Hamisi Juma',
		email: 'maintenance@serengetiexpress.co.tz',
		phone: '+255 767 889 123',
		address: 'Ubungo Bus Terminal Zone, Morogoro Road',
		city: 'Dar es Salaam',
		customerType: 'Fleet & Logistics',
		totalPurchases: 64200000,
		outstandingBalance: 8900000,
		invoicesCount: 22,
		creditLimit: 75000000,
		paymentTerms: 'Net 14',
		tin: '109-881-224',
		status: 'Pending'
	},
	{
		id: 'CUST-006',
		name: 'Dr. Josephat Kweka',
		contactPerson: 'Dr. Josephat Kweka',
		email: 'jkweka@hospital.or.tz',
		phone: '+255 754 330 918',
		address: 'Masaki Peninsula, Haile Selassie Road',
		city: 'Dar es Salaam',
		customerType: 'Retail / Private',
		totalPurchases: 5400000,
		outstandingBalance: 0,
		invoicesCount: 3,
		creditLimit: 5000000,
		paymentTerms: 'Due on Receipt',
		status: 'Paid'
	},
	{
		id: 'CUST-007',
		name: 'Tanroads Coast Region Project Unit',
		companyName: 'Tanzania National Roads Agency (TANROADS)',
		contactPerson: 'Eng. Baraka Mwita',
		email: 'coast.procure@tanroads.go.tz',
		phone: '+255 22 215 0000',
		address: 'Old Bagamoyo Road, Mwenge',
		city: 'Dar es Salaam',
		customerType: 'Government / NGO',
		totalPurchases: 96000000,
		outstandingBalance: 24500000,
		invoicesCount: 16,
		creditLimit: 120000000,
		paymentTerms: 'Net 14',
		tin: '100-001-999',
		status: 'Overdue'
	}

];

export const MOCK_SERVICES: WorkshopService[] = [
	{
		id: 'SRV-001',
		code: 'ALIGN-3D',
		title: 'Precision 3D Laser Wheel Alignment',
		category: 'Wheel Alignment & Balancing',
		description: 'High-accuracy computerized 4-wheel alignment for passenger cars, SUVs, and 4x4 safari vehicles.',
		estimatedMinutes: 45,
		priceTZS: 120000,
		popular: true,
		fleetEligible: true,
		activeBookings: 8
	},
	{
		id: 'SRV-002',
		code: 'BAL-DYN',
		title: 'Dynamic Computer Wheel Balancing',
		category: 'Wheel Alignment & Balancing',
		description: 'Precision electronic balance weight distribution to eliminate highway vibration and tire wear.',
		estimatedMinutes: 30,
		priceTZS: 35000,
		popular: true,
		fleetEligible: true,
		activeBookings: 14
	},
	{
		id: 'SRV-003',
		code: 'TRUCK-MOUNT',
		title: 'Heavy Truck Commercial Tyre Demount & Fitting',
		category: 'Truck & Fleet Tyre Care',
		description: 'Hydraulic tyre fitting for 22.5" and 24" steer/drive axle radial truck rims with bead seal inspection.',
		estimatedMinutes: 60,
		priceTZS: 85000,
		popular: true,
		fleetEligible: true,
		activeBookings: 19
	},
	{
		id: 'SRV-004',
		code: 'NITRO-FILL',
		title: 'High-Purity Nitrogen Tyre Inflation',
		category: 'Inspection & Maintenance',
		description: 'Full deflation and 99.2% pure nitrogen filling for lower tyre operating temperatures and pressure stability.',
		estimatedMinutes: 20,
		priceTZS: 25000,
		popular: false,
		fleetEligible: true,
		activeBookings: 6
	},
	{
		id: 'SRV-005',
		code: 'RESCUE-247',
		title: '24/7 Dar es Salaam Emergency Roadside Rescue',
		category: 'Emergency Assistance',
		description: 'Rapid mobile assistance unit dispatched to any location in Dar es Salaam for flat tyres and rim damage.',
		estimatedMinutes: 40,
		priceTZS: 150000,
		popular: true,
		fleetEligible: true,
		activeBookings: 3
	},
	{
		id: 'SRV-006',
		code: 'FLEET-INSPECT',
		title: 'Commercial Fleet Tyre Wear & Tread Depth Audit',
		category: 'Truck & Fleet Tyre Care',
		description: 'On-site digital tread depth, air pressure, and sidewall integrity audit for transport fleet operations.',
		estimatedMinutes: 90,
		priceTZS: 250000,
		popular: false,
		fleetEligible: true,
		activeBookings: 5
	},
	{
		id: 'SRV-007',
		code: 'VULCAN-HOT',
		title: 'Industrial Heavy Rubber Hot Vulcanization',
		category: 'Fitting & Demounting',
		description: 'Permanent sectional heat repair for heavy truck, tractor, and earthmover tyre punctures.',
		estimatedMinutes: 120,
		priceTZS: 95000,
		popular: false,
		fleetEligible: true,
		activeBookings: 7
	}
];

export const MOCK_MONTHLY_REVENUE: MonthlyRevenue[] = [
	{ month: 'March 2025', shortMonth: 'Mar', revenue: 112000000, target: 100000000, invoicesCount: 42 },
	{ month: 'April 2025', shortMonth: 'Apr', revenue: 128500000, target: 110000000, invoicesCount: 48 },
	{ month: 'May 2025', shortMonth: 'May', revenue: 145000000, target: 120000000, invoicesCount: 54 },
	{ month: 'June 2025', shortMonth: 'Jun', revenue: 139000000, target: 125000000, invoicesCount: 51 },
	{ month: 'July 2025', shortMonth: 'Jul', revenue: 162000000, target: 135000000, invoicesCount: 62 },
	{ month: 'August 2025', shortMonth: 'Aug', revenue: 158000000, target: 140000000, invoicesCount: 59 },
	{ month: 'September 2025', shortMonth: 'Sep', revenue: 174000000, target: 150000000, invoicesCount: 68 },
	{ month: 'October 2025', shortMonth: 'Oct', revenue: 168000000, target: 155000000, invoicesCount: 64 },
	{ month: 'November 2025', shortMonth: 'Nov', revenue: 192000000, target: 165000000, invoicesCount: 76 },
	{ month: 'December 2025', shortMonth: 'Dec', revenue: 215000000, target: 180000000, invoicesCount: 88 },
	{ month: 'January 2026', shortMonth: 'Jan', revenue: 184500000, target: 170000000, invoicesCount: 71 },
	{ month: 'February 2026', shortMonth: 'Feb', revenue: 198200000, target: 175000000, invoicesCount: 78 }
];

export const MOCK_BRAND_SHARE: BrandShare[] = [
	{ brand: 'Michelin', percentage: 34, unitsSold: 320, revenueTZS: 74200000, color: '#0f2038' },
	{ brand: 'Bridgestone', percentage: 26, unitsSold: 245, revenueTZS: 56800000, color: '#2d598d' },
	{ brand: 'Pirelli', percentage: 18, unitsSold: 168, revenueTZS: 39400000, color: '#38bdf8' },
	{ brand: 'Goodyear', percentage: 13, unitsSold: 122, revenueTZS: 28500000, color: '#f59e0b' },
	{ brand: 'Dunlop & Others', percentage: 9, unitsSold: 85, revenueTZS: 19700000, color: '#94a3b8' }
];

export interface TyreProductStock {
	id: string;
	sku: string;
	brand: string;
	model: string;
	size: string;
	application: string;
	unitPriceTZS: number;
	stockQuantity: number;
	reorderLevel: number;
	location: string;
	status: 'In Stock' | 'Low Stock' | 'Out of Stock';
	createdAt?: string;
	updatedAt?: string;
	createdBy?: string;
}

export const MOCK_TYRE_STOCKS: TyreProductStock[] = [
	{
		id: 'TYR-001',
		sku: 'MICH-265-65R17',
		brand: 'Michelin',
		model: 'Primacy SUV',
		size: '265/65 R17',
		application: 'SUV & 4x4 Land Cruiser',
		unitPriceTZS: 750000,
		stockQuantity: 68,
		reorderLevel: 20,
		location: 'Warehouse Bay A-1',
		status: 'In Stock'
	},
	{
		id: 'TYR-002',
		sku: 'MICH-315-80R22',
		brand: 'Michelin',
		model: 'X Multiway 3D',
		size: '315/80 R22.5',
		application: 'Commercial Prime Mover / Trailer',
		unitPriceTZS: 1250000,
		stockQuantity: 44,
		reorderLevel: 15,
		location: 'Warehouse Bay C-4',
		status: 'In Stock'
	},
	{
		id: 'TYR-003',
		sku: 'BDG-295-80R22',
		brand: 'Bridgestone',
		model: 'R150 Heavy Duty',
		size: '295/80 R22.5',
		application: 'Highway Long Distance Haulage',
		unitPriceTZS: 1180000,
		stockQuantity: 32,
		reorderLevel: 12,
		location: 'Warehouse Bay C-2',
		status: 'In Stock'
	},
	{
		id: 'TYR-004',
		sku: 'PIR-275-50R20',
		brand: 'Pirelli',
		model: 'Scorpion Verde All-Terrain',
		size: '275/50 R20',
		application: 'Luxury SUV & 4WD Safari',
		unitPriceTZS: 890000,
		stockQuantity: 24,
		reorderLevel: 10,
		location: 'Warehouse Bay B-3',
		status: 'In Stock'
	},
	{
		id: 'TYR-005',
		sku: 'GDY-1200-R20',
		brand: 'Goodyear',
		model: 'Omnitrac Mixed Service',
		size: '12.00 R20',
		application: 'Mining & Heavy Dump Truck',
		unitPriceTZS: 1420000,
		stockQuantity: 18,
		reorderLevel: 10,
		location: 'Warehouse Heavy Yard',
		status: 'In Stock'
	},
	{
		id: 'TYR-006',
		sku: 'CONT-235-60R18',
		brand: 'Continental',
		model: 'CrossContact LX Sport',
		size: '235/60 R18',
		application: 'Crossover & Passenger Car',
		unitPriceTZS: 520000,
		stockQuantity: 35,
		reorderLevel: 15,
		location: 'Warehouse Bay A-3',
		status: 'In Stock'
	},
	{
		id: 'TYR-007',
		sku: 'DNL-1100-R20',
		brand: 'Dunlop',
		model: 'SP571 Off-Road',
		size: '11.00 R20',
		application: 'Logging & Rough Terrain Hauling',
		unitPriceTZS: 980000,
		stockQuantity: 28,
		reorderLevel: 10,
		location: 'Warehouse Bay B-1',
		status: 'In Stock'
	}
];

export const MOCK_TOP_PRODUCTS: TopProduct[] = [
	{
		name: 'Michelin 265/65R17 Primacy SUV',
		category: 'SUV & 4x4 Safari',
		unitsSold: 142,
		revenueTZS: 106500000,
		trend: '+22%'
	},
	{
		name: 'Pirelli 315/80R22.5 FH01 Truck Steer',
		category: 'Heavy Commercial Truck',
		unitsSold: 98,
		revenueTZS: 125440000,
		trend: '+19%'
	},
	{
		name: 'Bridgestone 275/70R16 Dueler A/T',
		category: 'Land Cruiser / 4WD',
		unitsSold: 88,
		revenueTZS: 55000000,
		trend: '+14%'
	},
	{
		name: 'Goodyear 315/80R22.5 KMAX Drive Axle',
		category: 'Heavy Haulage Truck',
		unitsSold: 76,
		revenueTZS: 102600000,
		trend: '+8%'
	},
	{
		name: 'Continental 285/60R18 CrossContact',
		category: 'V8 Fleet / Executive',
		unitsSold: 64,
		revenueTZS: 56960000,
		trend: '+14%'
	}
];

export const MOCK_INVOICE_STATUS: InvoiceStatusMetric[] = [
	{ status: 'Paid', count: 58, totalAmountTZS: 142800000, percentage: 68, color: '#0f2038' },
	{ status: 'Pending', count: 18, totalAmountTZS: 44200000, percentage: 22, color: '#f59e0b' },
	{ status: 'Overdue', count: 6, totalAmountTZS: 18500000, percentage: 10, color: '#ef4444' }
];


export const MOCK_RECENT_INVOICES = [
	{
		id: 'INV-2026-0842',
		customer: 'Tanzania Safari Logistics Ltd',
		date: '2026-01-29',
		dueDate: '2026-02-12',
		amount: 13375000,
		status: 'Pending',
		itemsCount: 3,
		paymentTerms: 'Net 14',
		billingAddress: 'Samora Avenue, Clock Tower Roundabout, P.O. Box 4521, Dar es Salaam, Tanzania (Tel: +255 754 112 233)',
		items: [
			{ id: 'itm-842-1', description: 'Michelin 265/65R17 Primacy SUV Tubeless (MIC-2656517)', qty: 10, unitPrice: 750000, stockId: 'STK-001', sku: 'MIC-2656517' },
			{ id: 'itm-842-2', description: 'Bridgestone 275/70R16 Land Cruiser A/T Heavy Duty (BST-2757016)', qty: 5, unitPrice: 650000, stockId: 'STK-003', sku: 'BST-2757016' },
			{ id: 'itm-842-3', description: 'High-Speed Dynamic Wheel Balancing & Heavy Duty Tubeless Valves', qty: 15, unitPrice: 35000 }
		],
		discount: 0,
		taxRate: 18,
		notes: 'Approved safari fleet supply batch. Net 14 credit terms as per corporate agreement.'
	},
	{
		id: 'INV-2026-0841',
		customer: 'Bakhresa Transport & Haulage Ltd',
		date: '2026-01-28',
		dueDate: '2026-02-11',
		amount: 32400000,
		status: 'Paid',
		itemsCount: 2,
		paymentTerms: 'Net 14',
		billingAddress: 'Tazara Industrial Zone, Mandela Road, P.O. Box 2517, Dar es Salaam, Tanzania (Tel: +255 22 286 1120)',
		items: [
			{ id: 'itm-841-1', description: 'Pirelli 315/80R22.5 FH01 Heavy Commercial Steer Tyres (PIR-31580225)', qty: 20, unitPrice: 1150000, stockId: 'STK-002', sku: 'PIR-31580225' },
			{ id: 'itm-841-2', description: 'Continental 12.00R20 HDR Heavy Haulage Radial (CON-120020)', qty: 8, unitPrice: 600000, stockId: 'STK-004', sku: 'CON-120020' }
		],
		discount: 0,
		taxRate: 18,
		notes: 'Bulk haulage truck replacement batch. Payment received and verified via CRDB Corporate.'
	},
	{
		id: 'INV-2026-0840',
		customer: 'Kilimanjaro Mining & Exploration Ltd',
		date: '2026-01-27',
		dueDate: '2026-01-27',
		amount: 14850000,
		status: 'Paid',
		itemsCount: 2,
		paymentTerms: 'Due on Receipt',
		billingAddress: 'Ali Hassan Mwinyi Road, Oysterbay, P.O. Box 9012, Dar es Salaam, Tanzania (Tel: +255 784 900 120)',
		items: [
			{ id: 'itm-840-1', description: 'Pirelli 12.00R24 Amarok OTR Mining Radial (PIR-120024)', qty: 10, unitPrice: 1250000 },
			{ id: 'itm-840-2', description: 'OTR Heavy Industrial High-Pressure Nitrogen Inflation Service', qty: 10, unitPrice: 45000 }
		],
		discount: 0,
		taxRate: 18,
		notes: 'Mining site exploration unit fitment. Settled in full upon delivery.'
	},
	{
		id: 'INV-2026-0839',
		customer: 'Tanroads Coast Region Project',
		date: '2026-01-25',
		dueDate: '2026-02-08',
		amount: 24500000,
		status: 'Overdue',
		itemsCount: 2,
		paymentTerms: 'Net 14',
		billingAddress: 'Morogoro Road, Kibaha Regional HQ, P.O. Box 3010, Coast Region, Tanzania (Tel: +255 23 240 2110)',
		items: [
			{ id: 'itm-839-1', description: 'Sailun 315/80R22.5 S815 Mixed Service All-Position Tyres (SLN-31580225)', qty: 30, unitPrice: 680000, stockId: 'STK-007', sku: 'SLN-31580225' },
			{ id: 'itm-839-2', description: 'Fleet 3D Laser Multi-Axle Computerized Alignment', qty: 5, unitPrice: 150000 }
		],
		discount: 0,
		taxRate: 18,
		notes: 'Regional government infrastructure road work batch. Notice issued for pending milestone.'
	},
	{
		id: 'INV-2026-0838',
		customer: 'Mo Dewji Fleet Operations',
		date: '2026-01-24',
		dueDate: '2026-02-07',
		amount: 48900000,
		status: 'Paid',
		itemsCount: 3,
		paymentTerms: 'Net 14',
		billingAddress: 'MeTL House, Indiras Gandhi Street, P.O. Box 20660, Dar es Salaam, Tanzania (Tel: +255 22 211 4455)',
		items: [
			{ id: 'itm-838-1', description: 'Michelin 315/80R22.5 X MultiWay 3D Heavy Long-Haul Tyres (MIC-31580225)', qty: 36, unitPrice: 1100000, stockId: 'STK-009', sku: 'MIC-31580225' },
			{ id: 'itm-838-2', description: 'Dunlop 295/80R22.5 SP320 Highway Commercial Drive Tyres (DNL-29580225)', qty: 10, unitPrice: 850000, stockId: 'STK-006', sku: 'DNL-29580225' },
			{ id: 'itm-838-3', description: 'Commercial Fleet Complete Demounting, Mounting & High-Pressure Rim Sealing', qty: 46, unitPrice: 25000 }
		],
		discount: 0,
		taxRate: 18,
		notes: 'National logistics distribution fleet quarterly renewal. Full payment verified.'
	}
];

export const MOCK_LOW_STOCK_ALERTS = [
	{
		brand: 'Michelin',
		size: '265/65R17 Primacy SUV',
		currentStock: 4,
		minThreshold: 15,
		reorderStatus: 'Urgent Reorder'
	},
	{
		brand: 'Pirelli',
		size: '315/80R22.5 FH01 Steer',
		currentStock: 6,
		minThreshold: 20,
		reorderStatus: 'Low Stock'
	},
	{
		brand: 'Bridgestone',
		size: '275/70R16 Land Cruiser A/T',
		currentStock: 5,
		minThreshold: 16,
		reorderStatus: 'Low Stock'
	}
];

export const MOCK_PAYMENT_DETAILS: PaymentDetail[] = [
	{
		id: 'PAY-001',
		bankName: 'CRDB Bank Plc',
		accountName: 'Anagkazo Autoparts Co. Ltd',
		accountNumber: '01504289033400',
		swiftCode: 'CORUTZTZ',
		branch: 'Samora Tower Commercial Branch, Dar es Salaam',
		currency: 'TZS',
		accountType: 'Corporate Bank',
		isDefault: true,
		notes: 'Primary Tanzanian Shilling corporate collection account'
	},
	{
		id: 'PAY-002',
		bankName: 'NMB Bank Plc',
		accountName: 'Anagkazo Autoparts Co. Ltd',
		accountNumber: '22501004928100',
		swiftCode: 'NMIBTZTZ',
		branch: 'Clock Tower Branch, Dar es Salaam',
		currency: 'TZS',
		accountType: 'Commercial Bank',
		isDefault: false,
		notes: 'Commercial fleet and wholesale settlement account'
	},
	{
		id: 'PAY-003',
		bankName: 'Vodacom M-Pesa Merchant',
		accountName: 'Anagkazo Autoparts Co. Ltd',
		accountNumber: 'Till: 5894321 / Paybill: 400239',
		swiftCode: 'N/A',
		branch: 'Direct Mobile Merchant Wallet',
		currency: 'TZS',
		accountType: 'Mobile Money / Till',
		isDefault: false,
		notes: 'Instant mobile money payments via Lipa Kwa M-Pesa'
	},
	{
		id: 'PAY-004',
		bankName: 'Stanbic Bank Tanzania Ltd',
		accountName: 'Anagkazo Autoparts Co. Ltd',
		accountNumber: '91200004829100',
		swiftCode: 'SBICZTZX',
		branch: 'Oysterbay Branch, Dar es Salaam',
		currency: 'USD',
		accountType: 'Corporate Bank',
		isDefault: false,
		notes: 'USD foreign currency invoice settlement'
	}
];

