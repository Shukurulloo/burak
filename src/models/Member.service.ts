import MemberModel from "../schema/Member.model";
import { LoginInput, Member, MemberInput } from "../libs/types/member";
import Errors, { HttpCode, Message } from "../libs/Errors";
import { MemberType } from "../libs/enums/member.anum";
import * as bcrypt from "bcryptjs";

class MemberService {
    private readonly memberModel;

    constructor() {
    this.memberModel = MemberModel;
    }

/** SPA = Single Page Application */

    public async signup(input: MemberInput): Promise<Member> {             //<void> hechnimani qaytarmaslik(return) uchn
        const salt = await bcrypt.genSalt();
        input.memberPassword = await bcrypt.hash(input.memberPassword, salt);

        try {
            const result = await this.memberModel.create(input);
            result.memberPassword = "";
            return result.toJSON(); // databacedan kelgan qiymatni jsonga o'giradi
        }   catch (err) {
            console.error("Error, model:signup", err); // consolga hato habarini yuboradi
            throw new Errors(HttpCode.BAD_REQUEST, Message.USED_NICK_PHONE);
        }
    }

    public async login(input: LoginInput): Promise<Member> {
        // TODO: Consider member status later
        const member = await this.memberModel
            .findOne(
                {memberNick: input.memberNick}, // search
                {memberNick: 1, memberPassword: 1} // obtions
            )
            .exec();
        if(!member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_NICK);

            const isMatch = await bcrypt.compare(
                input.memberPassword, 
                member.memberPassword
            );
        if(!isMatch) {
            throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);
        }

        return await this.memberModel.findById(member._id).lean().exec(); //lean bilan databacedagi datani tahrirqilsh mn
    }

/** SRR */

    public async processSignup(input: MemberInput): Promise<Member> {             //<void> hechnimani qaytarmaslik(return) uchn
        const exist = await this.memberModel
            .findOne({memberType: MemberType.RESTAURANT})
            .exec();      // restaran 1tadan oshmasligi uchun
        console.log("exist:", exist);
        if(exist) throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED);

        console.log("before:", input.memberPassword);
        const salt = await bcrypt.genSalt();
        input.memberPassword = await bcrypt.hash(input.memberPassword, salt);
        console.log("after:",input.memberPassword);

        try {
            const result = await this.memberModel.create(input);
            result.memberPassword = "";
            return result;
        }   catch (err) {
            throw new Errors(HttpCode.BAD_REQUEST, Message.CREATE_FAILED); // databace monguse errorni o'rniga
        }

    }

    public async processLogin(input: LoginInput): Promise<Member> {
        const member = await this.memberModel
            .findOne(
                {memberNick: input.memberNick}, 
                {memberNick: 1, memberPassword: 1})
            .exec();
        if(!member) throw new Errors(HttpCode.NOT_FOUND, Message.NO_MEMBER_NICK);

            const isMatch = await bcrypt.compare(
                input.memberPassword, 
                member.memberPassword);

        // const isMatch = input.memberPassword === member.memberPassword;
        

        if(!isMatch) {
            throw new Errors(HttpCode.UNAUTHORIZED, Message.WRONG_PASSWORD);
        }

        
        return await this.memberModel.findById(member._id).exec();
    }
}

export default MemberService;