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

export const orderSchema = z.object({
  deviceId: z.string().optional(),
  chickenType: z.enum(['whole', 'pieces']),
  quantity: z.number().min(1),
  price: z.number(),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  deliveryLocationType: z.enum(['school', 'off-campus']).default('school'),
  school: universitySchema.optional(),
  block: z.string().optional(),
  room: z.string().optional(),
  area: z.string().optional(),
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
        if (!data.area || data.area.trim().length < 1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Area is required.', path: ['area'] });
        }
        if (!data.street || data.street.trim().length < 1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Street is required.', path: ['street'] });
        }
        if (!data.houseNumber || data.houseNumber.trim().length < 1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'House number is required.', path: ['houseNumber'] });
        }
    }
});


export type OrderInput = z.infer<typeof orderSchema>;
