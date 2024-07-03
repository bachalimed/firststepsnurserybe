const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose)

const noteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        title: {
            type: String,
            required: true
        },
        text: {
            type: String,
            required: true
        },
        completed: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true//will automatically provide created at and updated at times
    }
)

noteSchema.plugin(AutoIncrement, {
    inc_field: 'ticket',//will create another field in the schema
    id: 'ticketNums',//a counter collection will be created to store the ids
    start_seq: 500//we want the id to start at 500
})

module.exports = mongoose.model('Note', noteSchema)