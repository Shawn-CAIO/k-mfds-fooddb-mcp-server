import { toFoodNutrition } from '../src/external/mfds/mapper';
import { AmtNumDataType } from '../src/external/mfds/types/AmtNumDataType';

const component = (item: Record<string, any>, name: string) =>
  toFoodNutrition(item).nutritionComponents.find(each => each.name === name);

describe('영양성분 매핑 (FoodNtrCpntDbInfo03)', () => {
  it('천 단위 쉼표가 있는 값을 올바르게 읽는다', () => {
    expect(component({ AMT_NUM13: '1,010.000' }, '나트륨')?.value).toBe(1010);
  });

  it('비어 있거나 숫자가 아닌 값은 성분 목록에서 뺀다', () => {
    const { nutritionComponents } = toFoodNutrition({ AMT_NUM1: '', AMT_NUM2: null, AMT_NUM3: 'N/A', AMT_NUM4: '0.00' });
    expect(nutritionComponents.map(each => each.name)).toEqual(['지방']);
  });

  it('FoodNtrCpntDbInfo03 공식 명세의 코드와 성분을 맞춘다', () => {
    expect(Object.keys(AmtNumDataType)).toHaveLength(157);
    expect(AmtNumDataType.AMT_NUM23).toMatchObject({ name: '콜레스테롤', unit: 'mg' });
    expect(AmtNumDataType.AMT_NUM24).toMatchObject({ name: '포화지방산', unit: 'g' });
    expect(AmtNumDataType.AMT_NUM25).toMatchObject({ name: '트랜스지방산', unit: 'g' });
  });

  it('표에 없는 코드가 와도 실패하지 않고 코드명으로 표시한다', () => {
    expect(component({ AMT_NUM999: '1.5' }, 'AMT_NUM999')?.value).toBe(1.5);
  });
});
