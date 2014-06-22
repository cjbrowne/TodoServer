module.exports = function (mongoose) {
    var ObjectId = mongoose.Schema.ObjectId;
    var UserSchema = mongoose.Schema({
        username: String,
        password_hash: String,
        todoCollection: ObjectId
    });
    mongoose.model('User', UserSchema);
    return {
        model: mongoose.model('User'),
        schema: UserSchema
    };
};
