/***************************************************
 * Created by nanyuantingfeng on 2020/4/23 17:27. *
 ***************************************************/
const parseInjectOptions = require('../lib/helpers/parse-inject-options')

function toEquals0(data, len1, len2) {
  expect(data).toBeInstanceOf(Array)
  expect(data.length).toBe(len1)

  if (len1 >= 1) {
    expect(data[0]).toBeInstanceOf(Array)
    expect(data[0][0]).toBeInstanceOf(Function)
    expect(data[0].length).toBe(len2)
  }
}

function toEquals1(data, len1, len2, k) {
  expect(data).toBeInstanceOf(Array)
  expect(data.length).toBe(len1)

  if (len1 >= 1) {
    expect(data[0]).toBeInstanceOf(Array)
    expect(data[0].length).toBe(len2)
    expect(data[0][0]).toBeInstanceOf(Function)
    expect(data[0][1]).toEqual(k)
  }
}

it('should simple string or loader', () => {
  toEquals0(parseInjectOptions('111'), 1, 1)
  toEquals0(parseInjectOptions(['111']), 1, 1)
  toEquals0(
    parseInjectOptions(() => '111'),
    1,
    1
  )
  toEquals0(parseInjectOptions([() => '111']), 1, 1)
})

it('should array<string or loader>', () => {
  toEquals1(parseInjectOptions([['1111', { a: 1 }]]), 1, 2, { a: 1 })
  toEquals1(parseInjectOptions([[() => '111', { a: 1 }]]), 1, 2, { a: 1 })
})
