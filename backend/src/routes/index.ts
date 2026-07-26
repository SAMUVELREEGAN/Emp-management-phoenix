import { Router } from 'express';
import authRoutes from './authRoutes';
import employeeRoutes from './employeeRoutes';
import attendanceRoutes from './attendanceRoutes';
import workReportRoutes from './workReportRoutes';
import notificationRoutes from './notificationRoutes';
import dashboardRoutes from './dashboardRoutes';
import settingsRoutes from './settingsRoutes';
import taskRoutes from './taskRoutes';
import leaveRoutes from './leaveRoutes';
import routeRoutes from './routeRoutes';
import announcementRoutes from './announcementRoutes';
import chatRoutes from './chatRoutes';
import geocodeRoutes from './geocodeRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/work-reports', workReportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);
router.use('/tasks', taskRoutes);
router.use('/leave-requests', leaveRoutes);
router.use('/routes', routeRoutes);
router.use('/announcements', announcementRoutes);
router.use('/chat', chatRoutes);
router.use('/geocode', geocodeRoutes);

export default router;
