/*
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import passport from 'passport';
import pinoMiddleware from 'pino-http';
import { bookingsRouter } from './bookings.router';
import { authenticateApiKey, fabricAPIKeyStrategy } from './auth';
import { healthRouter } from './health.router';
import { jobsRouter } from './jobs.router';
import { logger } from './logger';
import { transactionsRouter } from './transactions.router';
import cors from 'cors';

const { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } = StatusCodes;

export const createServer = async (): Promise<Application> => {
    const app = express();

    app.use(
        pinoMiddleware({
            logger,
            customLogLevel: function customLogLevel(res, err) {
                if (
                    res.statusCode >= BAD_REQUEST &&
                    res.statusCode < INTERNAL_SERVER_ERROR
                ) {
                    return 'warn';
                }

                if (res.statusCode >= INTERNAL_SERVER_ERROR || err) {
                    return 'error';
                }

                return 'debug';
            },
        })
    );

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // define passport startegy
    passport.use(fabricAPIKeyStrategy);

    // initialize passport js
    app.use(passport.initialize());

    app.use(cors({
        origin: "*", 
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Api-Key"],
    }));

    app.use('/', healthRouter);
    app.use('/api/bookings', authenticateApiKey, bookingsRouter);
    app.use('/api/jobs', authenticateApiKey, jobsRouter);
    app.use('/api/transactions', authenticateApiKey, transactionsRouter);

    // For everything else
    app.use((_req, res) =>
        res.status(NOT_FOUND).json({
            status: getReasonPhrase(NOT_FOUND),
            timestamp: new Date().toISOString(),
        })
    );

    // Print API errors
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        logger.error(err);
        return res.status(INTERNAL_SERVER_ERROR).json({
            status: getReasonPhrase(INTERNAL_SERVER_ERROR),
            timestamp: new Date().toISOString(),
        });
    });

    return app;
};
