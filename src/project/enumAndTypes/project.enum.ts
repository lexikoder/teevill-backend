import mongoose from 'mongoose';
import { Invite } from '../schemas/invite.schema';
import { ProjectDocument } from '../schemas/project.schema';

export enum projectType {
  shared = 'shared',
  client = 'client',
  personal = 'personal',
}

export type InviteWithProject = Invite & {
  projectId: {
    _id: mongoose.Types.ObjectId;
    title: string;
  };
};

export type PopulatedProjectDocument = ProjectDocument & {
  createdBy: {
    _id: mongoose.Types.ObjectId;
    email: string;
    firstName: string;
  };
};
