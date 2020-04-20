pragma solidity 0.6.4;

import './libray.sol';
import './Ownable.sol';
import './Membership.sol';
import './Token.sol';
import './Item.sol';

contract Shopping is Membership, Item{
    using SafeMath for uint;                //overflow, underflow를 막기 위한 safemath library 사용


    mapping(address=> itemInfo[]) public membershipItems;       //사용자가 구매한 아이템의 배열로 매핑되어 있는 배열


    event  ItemInfo(uint code, string name,string imgpath, uint cost);       //아이템 정보를 출력하기 위한 이벤트

    constructor(address payable __basictokenAddr) Membership(__basictokenAddr) public { }

    //사용자가 입력한 아이템 코드를 가지는 물건 구매
    function buyItem(address _buyer, uint _index) public returns(bool success) {
        uint8 rate;
        uint cost;
        uint payback;
        uint discountCost;

        checkBlacklist(_buyer);                      //사용자가 블랙리스트 인지 확인
        cost = itemInfos[_index].cost;                          //사용자가 구매를 원하는 물건의 가격
        rate = uint8(getCashbackRate(_buyer));       //사용자의 등급의 할인율 계산
        //ntokens = cost.mul((100-rate)/100);                     //물건의 가격 계산
        payback = cost.div(100).mul(rate);
        discountCost = cost.sub(payback);
        basicToken.transfer(owner, discountCost);                    //사용자가 가진 토큰을 물건의 가격 만큼 관리자에게 전송

        updateHistory(_buyer, cost);                 //사용자의 구매 정보 업데이트
        itemInfos[_index].buy = 1;
        membershipItems[_buyer].push(itemInfos[_index]);        //사용자별 구매한 아이템 배열에 구매한 아이템 정보 추가

        emit ItemInfo(itemInfos[_index].itemcode, itemInfos[_index].name,itemInfos[_index].imgpath, itemInfos[_index].cost);
        return true;
    }
    //사용자가 구매한 아이템 삭제
    function deleteMyItem(address _buyer, uint _index) public returns(bool success) {
        uint itemcode = membershipItems[_buyer][_index].itemcode;
        itemInfos[itemcode].buy = 0;
        delete membershipItems[_buyer][_index];
        return true;
    }

    //사용자가 구매한 물건의 정보 출력
    function getMyItems(address _buyer) public view returns(string memory itemsJson) {
        //표현 방식은 getItems 함수 와 동일
        itemInfo[] storage items = membershipItems[_buyer];
        itemsJson = '[';

        for( uint i = 0; i<items.length; i++ ){
            string memory itemcode = ConvertDataType.uintToStr(items[i].itemcode);
            string memory cost = ConvertDataType.uintToStr(items[i].cost);
            string memory imgpath = items[i].imgpath;
            string memory name = items[i].name;
            string memory id = ConvertDataType.uintToStr(i);

            if(keccak256(abi.encodePacked(name)) == keccak256(abi.encodePacked(""))){
                continue;
            }

            itemsJson = string(abi.encodePacked(itemsJson, '{ "itemCode" : ', itemcode, ','));
            itemsJson = string(abi.encodePacked(itemsJson, ' "cost" : ', cost, ','));
            itemsJson = string(abi.encodePacked(itemsJson, ' "imgpath" : "', imgpath, '",'));
            itemsJson = string(abi.encodePacked(itemsJson, ' "name" : "', name, '",'));
            itemsJson = string(abi.encodePacked(itemsJson, ' "id" :', id, '},'));
        }
        itemsJson = string(abi.encodePacked(itemsJson, '{ "itemCode" : "9999"} ]'));
        return itemsJson;
    }

    //회원 탈퇴 하면 가장 먼저 불림
    function withdrawal(address _buyer) public {
        deleteMemberInfo(_buyer);                //회원 관리에서의 정보 삭제
        itemInfo[] storage items = membershipItems[_buyer];
        for( uint i = 0; i<items.length; i++ ){
            uint itemcode = items[i].itemcode;
            itemInfos[itemcode].buy = 0;
        }
        delete membershipItems[_buyer];                     //사용자가 구매한 모든 아이템 정보 삭제
        basicToken.withdrawal(_buyer);                      //토큰 원래대로 환수
    }

}