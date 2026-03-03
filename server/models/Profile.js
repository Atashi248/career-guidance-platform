const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    phone: {type:String, default: ''},
    college: {type:String, default: ''},
    branch : {type:String, default: ''},
    cgpa: {type:Number, default: 0 },
    yearOfGraduation: {type:String, default: '' },
    skills: [{type: String}],
    interests: [{type: String}],
    dsalevel : {type:String, enum:['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    targetRole : {type:String, enum: ['Full Stack Developer', 'SDE', 'Data Analyst',''], default: '' },
    projects: [{
        title: {type: String },
        description: {type: String},
        techStack: {type: String},
        link: {type:String}
    }],
    internships:[{
        company: {type:String},
        role:{type:String},
        duration: {type: String}
    }],
    certifications:[{ type:String}],
    linkedIn: {type: String, default: ''},
    github: {type: String, default: ''},
}, {timestamps: true});

module.exports = mongoose.model('Profile', profileSchema);