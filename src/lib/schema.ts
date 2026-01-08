import { z } from 'zod';

export const universitySchema = z.enum([
  'University of Zambia (UNZA)',
  'Cavendish University',
  'University of Lusaka (UNILUS)',
  'Zambia ICT College',
  'National Institute of Public Administration (NIPA)',
  'Evelyn Hone College',
  'Apex Medical University',
  'Zambia Institute of Chartered Accountants (ZICA)',
  'DMI-St. Eugene University',
  'Lusaka Business and Technical College',
  'Other',
]);

export const lusakaTownsSchema = z.enum([
    'Avondale',
    'Buckley',
    'Chaisa',
    'Chakunkula',
    'Chamba Valley',
    'Chainda',
    'Chalala',
    'Chawama',
    'Chelston',
    'Chibombo',
    'Chilenje',
    'Chingwere',
    'Chunga',
    'Citra',
    'Emmasdale',
    'Fairview',
    'Garden',
    'Handsworth',
    'Ibex Hill',
    'Industrial Area',
    'Kabulonga',
    'Kalingalinga',
    'Kalundu',
    'Kamanga',
    'Kamwala',
    'Kanyama',
    'Kaunda Square',
    'Kayope',
    'Leopards Hill',
    'Libala',
    'Lilayi',
    'Longacres',
    'Lusaka West',

    'Makeni',
    'Mandevu',
    'Matero',
    'Meanwood',
    'Mtendere',
    'Munali',
    'Mutendere',
    'Mwembeshi',
    'Ngombe',
    'Northmead',
    'Nyumba Yanga',
    'Olympia',
    'PHI',
    'Presidential',
    'Rhodes Park',
    'Roma',
    'Salama Park',
    'Silverest',
    'State Lodge',
    'Thornpark',
    'Tigwilizane',
    'Twin Palm',
    'Villa Elizabetha',
    'Woodlands',
    'Other'
]);

const pieceDetailsSchema = z.object({
  breasts: z.number().min(0).default(0),
  thighs: z.number().min(0).default(0),
  drumsticks: z.number().min(0).default(0),
  wings: z.number().min(0).default(0),
});

export const orderSchema = z.object({
  deviceId: z.string().optional(),
  userId: z.string().optional(),
  chickenType: z.enum(['whole', 'pieces']),
  piecesType: z.enum(['mixed', 'custom']).optional(),
  quantity: z.number().min(1, { message: 'You must select at least one item.' }),
  price: z.number(),
  pieceDetails: pieceDetailsSchema.optional(),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  deliveryLocationType: z.enum(['school', 'off-campus']).default('school'),
  school: universitySchema.optional(),
  block: z.string().optional(),
  room: z.string().optional(),
  area: lusakaTownsSchema.optional(),
  street: z.string().optional(),
  houseNumber: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.deliveryLocationType === 'school') {
        if (!data.school) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select a school.', path: ['school'] });
        }
        if (!data.block || data.block.trim().length < 1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Block is required.', path: ['block'] });
        }
        if (!data.room || data.room.trim().length < 1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Room number is required.', path: ['room'] });
        }
    } else if (data.deliveryLocationType === 'off-campus') {
        if (!data.area) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select an area.', path: ['area'] });
        }
        if (!data.street || data.street.trim().length < 1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Street is required.', path: ['street'] });
        }
        if (!data.houseNumber || data.houseNumber.trim().length < 1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'House number is required.', path: ['houseNumber'] });
        }
    }

    if (data.chickenType === 'pieces') {
        if (!data.piecesType) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select a piece type.', path: ['piecesType'] });
        }
        if (data.piecesType === 'custom') {
            const totalPieces = Object.values(data.pieceDetails || {}).reduce((sum, val) => sum + (val || 0), 0);
            if (totalPieces < 1) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please select at least one chicken piece.', path: ['quantity'] });
            }
        }
    }
});


export type OrderInput = z.infer<typeof orderSchema>;
